package com.focuslock.app.data

import android.content.Context
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.util.LruCache
import com.focuslock.app.util.TimeUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * UI model combining everything known about one installed app:
 * identity, today's (effective) usage and its configured limit.
 *
 * "Effective usage" = system-reported usage minus the optional
 * "reset today's counted usage" offset. Editing a limit never changes
 * usage; it only changes how much remains.
 */
data class AppUiModel(
    val packageName: String,
    val label: String,
    val usageTodayMillis: Long,
    val systemUsageTodayMillis: Long,
    val limit: AppLimitEntity?
) {
    val hasLimit: Boolean get() = limit != null
    val isExempt: Boolean get() = limit?.exempt == true
    /** Limit exists, is switched on and the app is not exempt. */
    val limitActive: Boolean get() = limit != null && limit.enabled && !limit.exempt
    val limitMillis: Long get() = (limit?.dailyLimitMinutes ?: 0) * 60_000L
    val remainingMillis: Long
        get() = if (limitActive) (limitMillis - usageTodayMillis).coerceAtLeast(0L)
                else Long.MAX_VALUE
    val isOverLimit: Boolean get() = limitActive && usageTodayMillis >= limitMillis
    /** 0f..1f for progress bars. */
    val progress: Float
        get() = if (limitMillis > 0L)
            (usageTodayMillis.toFloat() / limitMillis.toFloat()).coerceIn(0f, 1f)
        else 0f
}

/** Small in-memory icon cache so RecyclerView scrolling stays smooth. */
object AppIconCache {
    private val cache = LruCache<String, Drawable>(150)

    fun get(context: Context, packageName: String): Drawable? {
        synchronized(cache) { cache.get(packageName)?.let { return it } }
        val icon = try {
            context.packageManager.getApplicationIcon(packageName)
        } catch (e: Exception) {
            null
        }
        if (icon != null) {
            synchronized(cache) { cache.put(packageName, icon) }
        }
        return icon
    }
}

class AppsRepository(
    private val context: Context,
    private val database: FocusLockDatabase,
    private val usageTracker: UsageTracker = UsageTracker(context)
) {

    /**
     * All launchable installed apps (except FocusLock itself) merged with
     * today's usage and their limits. Sorted alphabetically by label;
     * callers apply their own sort/filter for display.
     */
    suspend fun loadApps(now: Long = System.currentTimeMillis()): List<AppUiModel> =
        withContext(Dispatchers.IO) {
            val pm = context.packageManager
            val ownPackage = context.packageName

            @Suppress("DEPRECATION")
            val installed = pm.getInstalledApplications(PackageManager.GET_META_DATA)
                .filter { info ->
                    info.packageName != ownPackage &&
                        pm.getLaunchIntentForPackage(info.packageName) != null
                }

            val usageMap = usageTracker.usageSinceStartOfToday(now)
            val limitsByPackage = database.appLimitDao().getAll()
                .associateBy { it.packageName }
            val todayKey = TimeUtils.dateKey(now)
            val rowsByPackage = database.dailyUsageDao().getForDate(todayKey)
                .associateBy { it.packageName }

            installed.map { info ->
                val systemUsage = usageMap[info.packageName] ?: 0L
                val offset = rowsByPackage[info.packageName]?.usageOffsetMillis ?: 0L
                AppUiModel(
                    packageName = info.packageName,
                    label = pm.getApplicationLabel(info).toString(),
                    usageTodayMillis = (systemUsage - offset).coerceAtLeast(0L),
                    systemUsageTodayMillis = systemUsage,
                    limit = limitsByPackage[info.packageName]
                )
            }.sortedBy { it.label.lowercase() }
        }

    /** Effective usage (system minus reset-offset) for one package today. */
    suspend fun effectiveUsageToday(packageName: String, now: Long = System.currentTimeMillis()): Long {
        val systemUsage = withContext(Dispatchers.IO) {
            usageTracker.usageForPackageToday(packageName, now)
        }
        val offset = database.dailyUsageDao()
            .getForPackageDate(packageName, TimeUtils.dateKey(now))
            ?.usageOffsetMillis ?: 0L
        return (systemUsage - offset).coerceAtLeast(0L)
    }

    fun appLabel(packageName: String): String {
        return try {
            val pm = context.packageManager
            pm.getApplicationLabel(pm.getApplicationInfo(packageName, 0)).toString()
        } catch (e: Exception) {
            packageName
        }
    }

    fun appIcon(packageName: String): Drawable? = AppIconCache.get(context, packageName)
}
