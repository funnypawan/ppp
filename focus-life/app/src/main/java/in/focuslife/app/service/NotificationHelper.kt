package `in`.focuslife.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import `in`.focuslife.app.R

object NotificationHelper {
    const val CHANNEL_FOCUS = "focus_timer"
    const val CHANNEL_REMINDERS = "routine_reminders"
    const val NOTIF_FOCUS_ID = 1001

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (nm.getNotificationChannel(CHANNEL_FOCUS) == null) {
                nm.createNotificationChannel(
                    NotificationChannel(CHANNEL_FOCUS, context.getString(R.string.notification_channel_focus), NotificationManager.IMPORTANCE_LOW)
                )
            }
            if (nm.getNotificationChannel(CHANNEL_REMINDERS) == null) {
                nm.createNotificationChannel(
                    NotificationChannel(CHANNEL_REMINDERS, context.getString(R.string.notification_channel_reminders), NotificationManager.IMPORTANCE_DEFAULT)
                )
            }
        }
    }

    fun focusNotification(context: Context, text: String) {
        ensureChannels(context)
        val notification = NotificationCompat.Builder(context, CHANNEL_FOCUS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("FOCUS LIFE")
            .setContentText(text)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify(NOTIF_FOCUS_ID, notification)
    }

    fun reminderNotification(context: Context, title: String, text: String) {
        ensureChannels(context)
        val notification = NotificationCompat.Builder(context, CHANNEL_REMINDERS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(text)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.notify((System.currentTimeMillis() % 100000).toInt(), notification)
    }

    fun cancelFocus(context: Context) {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        nm.cancel(NOTIF_FOCUS_ID)
    }
}
