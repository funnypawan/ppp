package `in`.focuslife.app.data

import android.app.NotificationManager
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.provider.Settings
import `in`.focuslife.app.service.BlockerAccessibilityService

/**
 * Runtime status of every permission FOCUS LIFE uses.
 * Used by the in-app Permissions screen (Profile) and by docs verification.
 */
object PermissionHelper {

    data class PermissionStatus(
        val notifications: Boolean,
        val usageAccess: Boolean,
        val accessibility: Boolean
    )

    fun notificationsEnabled(context: Context): Boolean {
        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        return nm.areNotificationsEnabled()
    }

    fun accessibilityEnabled(context: Context): Boolean {
        return try {
            val enabled = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val expected = ComponentName(context, BlockerAccessibilityService::class.java).flattenToString()
            enabled.split(':').any { it.trim().equals(expected, ignoreCase = true) }
        } catch (e: Exception) {
            false
        }
    }

    fun status(context: Context): PermissionStatus = PermissionStatus(
        notifications = notificationsEnabled(context),
        usageAccess = UsageHelper.hasUsageAccess(context),
        accessibility = accessibilityEnabled(context)
    )
}
