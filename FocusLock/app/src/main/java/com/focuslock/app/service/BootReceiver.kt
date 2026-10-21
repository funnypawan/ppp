package com.focuslock.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.focuslock.app.data.SettingsStore
import com.focuslock.app.domain.ProtectionCoordinator
import com.focuslock.app.util.PermissionUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Restores protection after a reboot or after FocusLock itself is updated.
 *
 * What survives a reboot without any help (by design):
 *  - all app limits and settings (Room / DataStore),
 *  - the emergency session count for today,
 *  - a running emergency session's remaining time, because its end is an
 *    absolute wall-clock timestamp — rebooting can only ever *lose* time,
 *    never gain it.
 *
 * What this receiver adds:
 *  - re-posts the emergency countdown notification if a session is active,
 *  - restarts the monitor service when Android allows it,
 *  - checks permission health and warns if something was revoked,
 *  - runs one maintenance pass.
 *
 * Note: Android re-binds enabled accessibility services automatically after
 * boot, so instant blocking resumes even if the foreground-service start
 * is refused (Android 12+ background-start restrictions). In that case a
 * one-tap "resume protection" notification is shown as a fallback.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            return
        }

        val appContext = context.applicationContext
        val pendingResult = goAsync()
        CoroutineScope(SupervisorJob() + Dispatchers.Default).launch {
            try {
                val settings = SettingsStore(appContext).current()
                val coordinator = ProtectionCoordinator.getInstance(appContext)

                // Restores/expired-session bookkeeping + countdown notification.
                coordinator.tickEmergency()

                if (settings.protectionEnabled) {
                    val serviceStarted = MonitorService.start(appContext)
                    val accessibilityOn =
                        PermissionUtils.isAccessibilityServiceEnabled(appContext)
                    if (!serviceStarted && !accessibilityOn) {
                        // Nothing can enforce limits right now; ask the user
                        // to open FocusLock once (which restarts the service).
                        NotificationHelper.showResumeProtection(appContext)
                    }
                    coordinator.checkPermissionHealth()
                }

                MaintenanceWorker.schedulePeriodic(appContext)
                MaintenanceWorker.runOnce(appContext)
            } catch (e: Exception) {
                // Boot restore must never crash; WorkManager retries later.
            } finally {
                pendingResult.finish()
            }
        }
    }
}
