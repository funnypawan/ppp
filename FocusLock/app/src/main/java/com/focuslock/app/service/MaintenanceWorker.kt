package com.focuslock.app.service

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.focuslock.app.data.FocusLockDatabase
import com.focuslock.app.data.UsageTracker
import com.focuslock.app.domain.ProtectionCoordinator
import com.focuslock.app.util.TimeUtils
import java.util.concurrent.TimeUnit

/**
 * Periodic housekeeping, scheduled with WorkManager (survives process death
 * and Doze; approximately every 6 hours, plus once after boot).
 *
 * Jobs:
 *  1. Snapshot system usage for today/yesterday into the local database so
 *     statistics and history stay available even after the system prunes
 *     its own records.
 *  2. Prune old rows (usage: 90 days, emergency day-rows: 7 days).
 *  3. Permission health check — warns the user if Usage Access or the
 *     accessibility service was turned off while protection is enabled.
 *  4. Emergency bookkeeping (expiry is timestamp-based, this just keeps the
 *     statistics and notifications tidy).
 *
 * The daily reset itself needs no worker: limits, usage and emergency
 * allowances are all keyed by the local calendar date.
 */
class MaintenanceWorker(
    appContext: Context,
    params: WorkerParameters
) : CoroutineWorker(appContext, params) {

    override suspend fun doWork(): Result {
        return try {
            val context = applicationContext
            val database = FocusLockDatabase.getInstance(context)
            val usageTracker = UsageTracker(context)
            val coordinator = ProtectionCoordinator.getInstance(context)
            val now = System.currentTimeMillis()

            // 1) Usage snapshots for today (partial) and yesterday (full day).
            val startToday = TimeUtils.startOfDay(now)
            snapshotDay(database, usageTracker, startToday, now)
            val startYesterday = TimeUtils.startOfDay(startToday - 1L)
            snapshotDay(database, usageTracker, startYesterday, startToday)

            // 2) Prune history.
            database.dailyUsageDao()
                .deleteOlderThan(TimeUtils.dateKey(now - USAGE_RETENTION_MS))
            database.emergencyDao()
                .deleteOlderThan(TimeUtils.dateKey(now - EMERGENCY_RETENTION_MS))

            // 3) + 4) Health + emergency bookkeeping.
            coordinator.checkPermissionHealth(now)
            coordinator.tickEmergency(now)

            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }

    private suspend fun snapshotDay(
        database: FocusLockDatabase,
        usageTracker: UsageTracker,
        beginMillis: Long,
        endMillis: Long
    ) {
        val dateKey = TimeUtils.dateKey(beginMillis)
        val usage = usageTracker.foregroundTimeByEvents(beginMillis, endMillis)
        val dao = database.dailyUsageDao()
        for ((pkg, millis) in usage) {
            if (millis > 0L) dao.snapshotUsage(pkg, dateKey, millis)
        }
    }

    companion object {
        private const val PERIODIC_NAME = "focuslock_maintenance"
        private const val DAY_MS = 24L * 60L * 60L * 1000L
        private const val USAGE_RETENTION_MS = 90L * DAY_MS
        private const val EMERGENCY_RETENTION_MS = 7L * DAY_MS

        fun schedulePeriodic(context: Context) {
            val request = PeriodicWorkRequestBuilder<MaintenanceWorker>(
                6, TimeUnit.HOURS
            ).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                PERIODIC_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        }

        fun runOnce(context: Context) {
            val request = OneTimeWorkRequestBuilder<MaintenanceWorker>()
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .build()
            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
