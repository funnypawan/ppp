package com.focuslock.app.domain

import android.app.role.RoleManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import com.focuslock.app.data.AppsRepository
import com.focuslock.app.data.FocusLockDatabase
import com.focuslock.app.data.SettingsStore
import com.focuslock.app.data.UsageTracker
import com.focuslock.app.service.NotificationHelper
import com.focuslock.app.ui.BlockingActivity
import com.focuslock.app.util.PermissionUtils
import com.focuslock.app.util.TimeUtils

/** Shared flag: which package (if any) the blocking screen is showing for. */
object BlockingState {
    @Volatile
    var visiblePackage: String? = null
}

/**
 * The single place that combines usage data, limits, settings and the
 * emergency state into real blocking actions.
 *
 * It is driven from two independent signals so enforcement still works if
 * one of them is unavailable:
 *  1. [com.focuslock.app.service.FocusLockAccessibilityService] — instant,
 *     fires the moment another app comes to the foreground.
 *  2. [com.focuslock.app.service.MonitorService] — polls UsageStatsManager
 *     every couple of seconds; catches apps that reach their limit
 *     *mid-session* and emergency timers that expire while in use.
 *
 * A process-wide singleton is used so both drivers share the same
 * launch/attempt debouncing and never double-count blocked attempts.
 */
class ProtectionCoordinator private constructor(context: Context) {

    private val appContext: Context = context.applicationContext
    private val database: FocusLockDatabase = FocusLockDatabase.getInstance(appContext)
    private val settingsStore = SettingsStore(appContext)
    private val usageTracker = UsageTracker(appContext)
    private val appsRepository = AppsRepository(appContext, database, usageTracker)

    val emergencyManager = EmergencyManager(
        emergencyDao = database.emergencyDao(),
        dailyUsageDao = database.dailyUsageDao()
    )

    private val lastLaunchAt = HashMap<String, Long>()
    private val lastAttemptAt = HashMap<String, Long>()

    @Volatile private var lastWarningAt: Long = 0L
    @Volatile private var exemptCache: Set<String> = emptySet()
    @Volatile private var exemptCacheAt: Long = 0L

    /**
     * Main entry point. Handles emergency expiry bookkeeping, then blocks
     * [packageName] if the rules say so. Returns the blocked package or null.
     */
    suspend fun onForegroundPackage(
        packageName: String?,
        now: Long = System.currentTimeMillis()
    ): String? {
        tickEmergency(now)
        val pkg = packageName ?: return null
        if (pkg == appContext.packageName) return null
        if (shouldBlock(pkg, now)) {
            showBlockingScreen(pkg, now)
            return pkg
        }
        return null
    }

    suspend fun shouldBlock(
        packageName: String,
        now: Long = System.currentTimeMillis()
    ): Boolean {
        val settings = settingsStore.current()
        // Cheap early-outs keep the 2-second poll inexpensive; the full rule
        // set still runs through BlockEngine below.
        if (!settings.protectionEnabled) return false
        if (isSystemExempt(packageName, now)) return false
        val limit = database.appLimitDao().getForPackage(packageName) ?: return false
        if (!limit.enabled || limit.exempt) return false

        val status = emergencyManager.status()
        val usage = appsRepository.effectiveUsageToday(packageName, now)

        return BlockEngine.shouldBlock(
            BlockEngine.Input(
                packageName = packageName,
                usageTodayMillis = usage,
                limit = limit,
                protectionEnabled = settings.protectionEnabled,
                emergencyActiveForPackage =
                    status.activePackage == packageName && status.activeRemainingMillis > 0L,
                withinSchedule = settings.isWithinSchedule(now),
                breakActive = settings.isBreakActive(now),
                systemExempt = false // already checked above
            )
        )
    }

    /**
     * Expires a finished emergency session (restoring blocking + notifying
     * the user) and keeps the countdown notification fresh. Safe to call
     * from every poll tick and every accessibility event.
     */
    suspend fun tickEmergency(
        now: Long = System.currentTimeMillis()
    ): EmergencyManager.Status {
        val expiredPackage = emergencyManager.expireIfNeeded()
        if (expiredPackage != null) {
            NotificationHelper.cancelEmergencyCountdown(appContext)
            NotificationHelper.showEmergencyEnded(
                appContext,
                appsRepository.appLabel(expiredPackage)
            )
        }
        val status = emergencyManager.status()
        val active = status.activePackage
        if (active != null && status.activeRemainingMillis > 0L) {
            NotificationHelper.showEmergencyCountdown(
                context = appContext,
                appLabel = appsRepository.appLabel(active),
                endsAtMillis = status.activeEndsAtMillis,
                remainingMillis = status.activeRemainingMillis
            )
        }
        return status
    }

    private suspend fun showBlockingScreen(packageName: String, now: Long) {
        if (BlockingState.visiblePackage == packageName) return

        val lastLaunch = lastLaunchAt[packageName] ?: 0L
        if (now - lastLaunch < LAUNCH_DEBOUNCE_MS) return
        lastLaunchAt[packageName] = now

        val lastAttempt = lastAttemptAt[packageName] ?: 0L
        if (now - lastAttempt >= ATTEMPT_DEBOUNCE_MS) {
            lastAttemptAt[packageName] = now
            database.dailyUsageDao().incrementBlockedAttempts(
                packageName, TimeUtils.dateKey(now), now
            )
        }

        val intent = Intent(appContext, BlockingActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            putExtra(BlockingActivity.EXTRA_PACKAGE_NAME, packageName)
        }
        try {
            appContext.startActivity(intent)
        } catch (e: Exception) {
            // Some OEMs block background activity starts even with the
            // overlay permission. The accessibility service retries on the
            // next window event and additionally sends the user Home as a
            // fallback, so a failed launch never leaves the app usable for
            // long. (See README > Known bypasses.)
        }
    }

    /**
     * Packages that must never be blocked: FocusLock, launchers/home,
     * dialer & in-call UI (phone calls always work), System UI, Settings,
     * permission dialogs, emergency utilities and the current keyboard.
     */
    fun isSystemExempt(packageName: String, now: Long = System.currentTimeMillis()): Boolean {
        if (exemptCache.isEmpty() || now - exemptCacheAt > EXEMPT_CACHE_MS) {
            exemptCache = computeSystemExemptPackages()
            exemptCacheAt = now
        }
        return packageName in exemptCache
    }

    private fun computeSystemExemptPackages(): Set<String> {
        val result = hashSetOf(
            appContext.packageName,
            "android",
            "com.android.systemui",
            "com.android.settings",
            "com.android.permissioncontroller",
            "com.google.android.permissioncontroller",
            "com.android.emergency",
            "com.android.incallui",
            "com.google.android.dialer",
            "com.android.dialer"
        )
        val pm = appContext.packageManager
        try {
            val homeIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(homeIntent, PackageManager.MATCH_ALL)
                .forEach { result += it.activityInfo.packageName }
        } catch (e: Exception) { /* keep defaults */ }
        try {
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(Intent(Intent.ACTION_DIAL), PackageManager.MATCH_ALL)
                .forEach { result += it.activityInfo.packageName }
        } catch (e: Exception) { /* keep defaults */ }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                val roleManager = appContext.getSystemService(RoleManager::class.java)
                roleManager?.getRoleHolders(RoleManager.ROLE_DIALER)?.forEach { result += it }
                roleManager?.getRoleHolders(RoleManager.ROLE_EMERGENCY)?.forEach { result += it }
            } catch (e: Exception) { /* roles unavailable on this device */ }
        }
        try {
            val ime = Settings.Secure.getString(
                appContext.contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD
            )
            if (!ime.isNullOrEmpty()) {
                ComponentName.unflattenFromString(ime)?.packageName?.let { result += it }
            }
        } catch (e: Exception) { /* ignore */ }
        return result
    }

    /** (protected apps, apps over limit) for the status notification. */
    suspend fun protectionSummary(now: Long = System.currentTimeMillis()): Pair<Int, Int> {
        val limits = database.appLimitDao().getAll()
            .filter { it.enabled && !it.exempt }
        if (limits.isEmpty()) return 0 to 0
        val usageMap = usageTracker.usageSinceStartOfToday(now)
        val todayRows = database.dailyUsageDao().getForDate(TimeUtils.dateKey(now))
            .associateBy { it.packageName }
        var overLimit = 0
        for (limit in limits) {
            val systemUsage = usageMap[limit.packageName] ?: 0L
            val offset = todayRows[limit.packageName]?.usageOffsetMillis ?: 0L
            val effective = (systemUsage - offset).coerceAtLeast(0L)
            if (BlockEngine.isOverLimit(effective, limit)) overLimit++
        }
        return limits.size to overLimit
    }

    /**
     * Anti-bypass health check: records that accessibility was once enabled
     * (so turning it off later is detectable) and warns the user — at most
     * once per hour — when protection is degraded. FocusLock cannot (and
     * must not) re-enable these permissions by itself; Android requires the
     * user to do it, so the warning deep-links to the setup screen.
     */
    suspend fun checkPermissionHealth(
        now: Long = System.currentTimeMillis()
    ): PermissionUtils.Health {
        val health = PermissionUtils.health(appContext)
        val settings = settingsStore.current()
        if (health.accessibility && !settings.accessibilityWasEnabled) {
            settingsStore.setAccessibilityWasEnabled(true)
        }
        val accessibilityRevoked =
            settings.accessibilityWasEnabled && !health.accessibility
        if (settings.protectionEnabled &&
            (health.isDegraded || accessibilityRevoked) &&
            now - lastWarningAt > WARNING_THROTTLE_MS
        ) {
            lastWarningAt = now
            NotificationHelper.showProtectionWarning(appContext)
        }
        return health
    }

    companion object {
        private const val LAUNCH_DEBOUNCE_MS = 1_500L
        private const val ATTEMPT_DEBOUNCE_MS = 10_000L
        private const val EXEMPT_CACHE_MS = 60_000L
        private const val WARNING_THROTTLE_MS = 60L * 60L * 1000L

        @Volatile
        private var INSTANCE: ProtectionCoordinator? = null

        fun getInstance(context: Context): ProtectionCoordinator {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: ProtectionCoordinator(context).also { INSTANCE = it }
            }
        }
    }
}
