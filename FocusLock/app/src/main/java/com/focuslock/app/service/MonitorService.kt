package com.focuslock.app.service

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationManagerCompat
import com.focuslock.app.data.ForegroundTracker
import com.focuslock.app.data.SettingsStore
import com.focuslock.app.domain.ProtectionCoordinator
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/**
 * Foreground "monitor" service — the second enforcement layer.
 *
 * Every 2 seconds it asks UsageStatsManager which app is in the foreground
 * and hands that to [ProtectionCoordinator]. This catches:
 *  - apps that reach their daily limit while already open,
 *  - emergency sessions expiring while the user is inside the app,
 *  - devices where the accessibility service is not (or no longer) enabled.
 *
 * FocusLock does NOT rely on this service alone: limits are date-based,
 * emergency sessions are timestamp-based, the accessibility service is
 * re-bound by Android automatically, and WorkManager performs health
 * checks. If this service is killed, protection degrades gracefully
 * instead of breaking (see README > Reliability).
 */
class MonitorService : Service() {

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    private lateinit var foregroundTracker: ForegroundTracker
    private lateinit var coordinator: ProtectionCoordinator
    private lateinit var settingsStore: SettingsStore

    private var loopJob: Job? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        foregroundTracker = ForegroundTracker(this)
        coordinator = ProtectionCoordinator.getInstance(this)
        settingsStore = SettingsStore(this)

        val notification = NotificationHelper.protectionNotification(
            context = this, protectedCount = 0, overLimitCount = 0, paused = false
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NotificationHelper.ID_PROTECTION,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NotificationHelper.ID_PROTECTION, notification)
        }

        loopJob = scope.launch { runLoop() }
    }

    private suspend fun runLoop() {
        var tick = 0
        while (scope.isActive) {
            try {
                val settings = settingsStore.current()
                if (!settings.protectionEnabled) {
                    // Master switch off: nothing to monitor. The service is
                    // restarted from the UI when protection is re-enabled.
                    stopSelf()
                    return
                }

                if (isScreenInteractive()) {
                    val current = foregroundTracker.refresh()
                    coordinator.onForegroundPackage(current)
                    // Split-screen / multi-window: other resumed apps are
                    // visible too, so evaluate them as well.
                    for (pkg in foregroundTracker.resumedPackages()) {
                        if (pkg != current) coordinator.onForegroundPackage(pkg)
                    }
                } else {
                    // Screen off: only cheap emergency bookkeeping.
                    coordinator.tickEmergency()
                }

                tick++
                if (tick % STATUS_EVERY_N_TICKS == 0) {
                    refreshStatusNotification()
                    coordinator.checkPermissionHealth()
                }
            } catch (e: CancellationException) {
                throw e
            } catch (e: Exception) {
                // Keep the loop alive through transient failures (e.g. Usage
                // Access revoked mid-query surfaces as empty results).
            }
            delay(POLL_INTERVAL_MS)
        }
    }

    private suspend fun refreshStatusNotification() {
        val (protectedCount, overLimitCount) = coordinator.protectionSummary()
        val notification = NotificationHelper.protectionNotification(
            context = this,
            protectedCount = protectedCount,
            overLimitCount = overLimitCount,
            paused = false
        )
        try {
            NotificationManagerCompat.from(this)
                .notify(NotificationHelper.ID_PROTECTION, notification)
        } catch (e: SecurityException) {
            // Notifications permission not granted; foreground notification
            // simply stays as-is.
        }
    }

    private fun isScreenInteractive(): Boolean {
        val powerManager = getSystemService(POWER_SERVICE) as? PowerManager
        return powerManager?.isInteractive ?: true
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Ask Android to restart us if the process is killed for memory.
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        loopJob?.cancel()
        scope.cancel()
        super.onDestroy()
    }

    companion object {
        private const val POLL_INTERVAL_MS = 2_000L
        private const val STATUS_EVERY_N_TICKS = 15 // ~30 seconds

        @Volatile
        var isRunning: Boolean = false
            private set

        /**
         * Starts the service. Returns false instead of throwing when Android
         * refuses a background foreground-service start (Android 12+), so
         * callers can apply their fallback (resume notification, etc.).
         */
        fun start(context: Context): Boolean {
            return try {
                val intent = Intent(context, MonitorService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                true
            } catch (e: Exception) {
                false
            }
        }

        suspend fun startIfProtectionEnabled(context: Context): Boolean {
            val settings = SettingsStore(context.applicationContext).current()
            return if (settings.protectionEnabled) start(context) else false
        }

        fun stop(context: Context) {
            try {
                context.stopService(Intent(context, MonitorService::class.java))
            } catch (e: Exception) { /* already stopped */ }
        }
    }
}
