package `in`.focuslife.app.data

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings

data class AppUsage(
    val packageName: String,
    val appName: String,
    val foregroundMs: Long,
    val launchCount: Int
)

object UsageHelper {
    fun hasUsageAccess(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun usageAccessIntent(context: Context): Intent {
        return Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            data = android.net.Uri.parse("package:${context.packageName}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
    }

    fun queryTodayUsage(context: Context): List<AppUsage> {
        if (!hasUsageAccess(context)) return emptyList()
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val start = startOfDay(now)
        val stats = try {
            usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, start, now)
        } catch (e: SecurityException) {
            return emptyList()
        }
        val pm = context.packageManager
        return stats
            .filter { it.totalTimeInForeground > 0 && it.packageName != context.packageName }
            .map {
                val label = try {
                    pm.getApplicationLabel(pm.getApplicationInfo(it.packageName, 0)).toString()
                } catch (e: Exception) {
                    it.packageName
                }
                AppUsage(it.packageName, label, it.totalTimeInForeground, it.mLaunchCount)
            }
            .sortedByDescending { it.foregroundMs }
    }

    fun totalScreenMs(context: Context): Long = queryTodayUsage(context).sumOf { it.foregroundMs }

    fun startOfDay(time: Long): Long {
        val cal = java.util.Calendar.getInstance()
        cal.timeInMillis = time
        cal.set(java.util.Calendar.HOUR_OF_DAY, 0)
        cal.set(java.util.Calendar.MINUTE, 0)
        cal.set(java.util.Calendar.SECOND, 0)
        cal.set(java.util.Calendar.MILLISECOND, 0)
        return cal.timeInMillis
    }

    fun formatDuration(ms: Long): String {
        val totalMinutes = ms / 60000
        val hours = totalMinutes / 60
        val minutes = totalMinutes % 60
        return if (hours > 0) "${hours}h ${minutes}m" else "${minutes}m"
    }

    fun suggestions(totalMs: Long, limitMin: Int): List<String> {
        val usedMin = (totalMs / 60000).toInt()
        val list = mutableListOf<String>()
        if (usedMin > limitMin) {
            list.add("You exceeded your daily limit by ${usedMin - limitMin} min. Try a 5-minute walk instead of opening the app.")
        } else {
            list.add("You are within your limit. Keep the phone away during study slots.")
        }
        list.add("Turn off non-essential notifications for distracting apps.")
        list.add("Use Deep Focus mode for 25 minutes with the phone face-down.")
        list.add("Replace one scroll session with reading or revision.")
        return list
    }
}
