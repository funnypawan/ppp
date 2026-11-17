package `in`.focuslife.app.service

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import `in`.focuslife.app.R
import `in`.focuslife.app.data.AppDatabase
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter

class ReminderWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val db = AppDatabase.getInstance(applicationContext)
        val slots = db.routineSlotDao().getAll().filter { it.enabled }
        val now = LocalTime.now()
        val today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)

        // Find next slot within next 15 minutes and notify
        for (slot in slots) {
            try {
                val slotTime = LocalTime.parse(slot.time, DateTimeFormatter.ofPattern("HH:mm"))
                val diff = java.time.Duration.between(now, slotTime).toMinutes()
                if (diff in 0..15) {
                    NotificationHelper.reminderNotification(
                        applicationContext,
                        "FOCUS LIFE — ${slot.time}",
                        "${slot.title} — ${applicationContext.getString(R.string.notification_routine)}"
                    )
                }
            } catch (e: Exception) {
                // ignore malformed time
            }
        }

        // Revision reminder at 11:00 and 19:00 if tasks pending
        val tasks = db.studyTaskDao().getByDate(today)
        val pending = tasks.count { !it.completed }
        if (pending > 0 && (now.hour == 11 || now.hour == 19)) {
            NotificationHelper.reminderNotification(
                applicationContext,
                "Revision Reminder",
                "You have $pending pending study tasks today. Revise now."
            )
        }
        return Result.success()
    }
}
