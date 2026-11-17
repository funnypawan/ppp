package `in`.focuslife.app

import android.app.Application
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import `in`.focuslife.app.service.NotificationHelper
import `in`.focuslife.app.service.ReminderWorker
import java.util.concurrent.TimeUnit

class FocusLifeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
        val request = PeriodicWorkRequestBuilder<ReminderWorker>(15, TimeUnit.MINUTES).build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "focuslife_reminders",
            ExistingPeriodicWorkPolicy.KEEP,
            request
        )
    }
}
