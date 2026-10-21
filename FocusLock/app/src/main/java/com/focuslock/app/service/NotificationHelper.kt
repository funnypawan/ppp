package com.focuslock.app.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.focuslock.app.R
import com.focuslock.app.ui.MainActivity
import com.focuslock.app.ui.PermissionSetupActivity
import com.focuslock.app.util.TimeUtils

/** All FocusLock notifications: protection status, emergency countdown, warnings. */
object NotificationHelper {

    const val CHANNEL_PROTECTION = "protection"
    const val CHANNEL_EMERGENCY = "emergency"
    const val CHANNEL_WARNINGS = "warnings"

    const val ID_PROTECTION = 1001
    const val ID_EMERGENCY = 1002
    const val ID_WARNING = 1003
    const val ID_EMERGENCY_ENDED = 1004
    const val ID_RESUME = 1005

    fun createChannels(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_PROTECTION,
                context.getString(R.string.notif_channel_protection),
                NotificationManager.IMPORTANCE_LOW
            ).apply { description = context.getString(R.string.notif_channel_protection_desc) }
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_EMERGENCY,
                context.getString(R.string.notif_channel_emergency),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = context.getString(R.string.notif_channel_emergency_desc) }
        )
        manager.createNotificationChannel(
            NotificationChannel(
                CHANNEL_WARNINGS,
                context.getString(R.string.notif_channel_warnings),
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply { description = context.getString(R.string.notif_channel_warnings_desc) }
        )
    }

    private fun mainActivityIntent(context: Context, targetTab: String? = null): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            if (targetTab != null) putExtra(MainActivity.EXTRA_TARGET_TAB, targetTab)
        }
        return PendingIntent.getActivity(
            context,
            targetTab?.hashCode() ?: 0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    /** Ongoing foreground-service notification (also a handy status glance). */
    fun protectionNotification(
        context: Context,
        protectedCount: Int,
        overLimitCount: Int,
        paused: Boolean
    ): Notification {
        val title = if (paused) {
            context.getString(R.string.notif_protection_paused)
        } else {
            context.getString(R.string.notif_protection_running)
        }
        val text = context.getString(R.string.notif_protection_sub, protectedCount, overLimitCount)
        return NotificationCompat.Builder(context, CHANNEL_PROTECTION)
            .setSmallIcon(R.drawable.ic_shield)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(mainActivityIntent(context))
            .setOngoing(true)
            .setShowWhen(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    /**
     * Visible emergency countdown. The system chronometer keeps counting
     * down (and [setTimeoutAfter] dismisses the notification at expiry) even
     * if FocusLock's process is killed, because the end time is absolute.
     */
    fun showEmergencyCountdown(
        context: Context,
        appLabel: String,
        endsAtMillis: Long,
        remainingMillis: Long
    ) {
        val notification = NotificationCompat.Builder(context, CHANNEL_EMERGENCY)
            .setSmallIcon(R.drawable.ic_clock)
            .setContentTitle(context.getString(R.string.notif_emergency_title))
            .setContentText(
                context.getString(
                    R.string.notif_emergency_text,
                    appLabel,
                    TimeUtils.formatCountdown(remainingMillis)
                )
            )
            .setContentIntent(mainActivityIntent(context, MainActivity.TAB_EMERGENCY))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setWhen(endsAtMillis)
            .setUsesChronometer(true)
            .setChronometerCountDown(true)
            .setTimeoutAfter(remainingMillis.coerceAtLeast(0L))
            .build()
        notifySafely(context, ID_EMERGENCY, notification)
    }

    fun cancelEmergencyCountdown(context: Context) {
        NotificationManagerCompat.from(context).cancel(ID_EMERGENCY)
    }

    fun showEmergencyEnded(context: Context, appLabel: String) {
        val notification = NotificationCompat.Builder(context, CHANNEL_EMERGENCY)
            .setSmallIcon(R.drawable.ic_shield)
            .setContentTitle(context.getString(R.string.app_name))
            .setContentText(context.getString(R.string.notif_emergency_ended, appLabel))
            .setContentIntent(mainActivityIntent(context, MainActivity.TAB_EMERGENCY))
            .setAutoCancel(true)
            .build()
        notifySafely(context, ID_EMERGENCY_ENDED, notification)
    }

    fun showProtectionWarning(context: Context) {
        val intent = Intent(context, PermissionSetupActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pending = PendingIntent.getActivity(
            context, ID_WARNING, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(context, CHANNEL_WARNINGS)
            .setSmallIcon(R.drawable.ic_warning)
            .setContentTitle(context.getString(R.string.notif_warning_title))
            .setContentText(context.getString(R.string.notif_warning_text))
            .setStyle(NotificationCompat.BigTextStyle().bigText(context.getString(R.string.notif_warning_text)))
            .setContentIntent(pending)
            .setAutoCancel(true)
            .build()
        notifySafely(context, ID_WARNING, notification)
    }

    /** Shown after reboot when Android refused to auto-start the monitor service. */
    fun showResumeProtection(context: Context) {
        val notification = NotificationCompat.Builder(context, CHANNEL_WARNINGS)
            .setSmallIcon(R.drawable.ic_shield)
            .setContentTitle(context.getString(R.string.notif_resume_title))
            .setContentText(context.getString(R.string.notif_resume_text))
            .setContentIntent(mainActivityIntent(context))
            .setAutoCancel(true)
            .build()
        notifySafely(context, ID_RESUME, notification)
    }

    private fun notifySafely(context: Context, id: Int, notification: Notification) {
        try {
            NotificationManagerCompat.from(context).notify(id, notification)
        } catch (e: SecurityException) {
            // POST_NOTIFICATIONS not granted (Android 13+) — notifications are
            // helpful but never required for blocking to work.
        }
    }
}
