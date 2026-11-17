package `in`.focuslife.app.service

import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.CountDownTimer
import android.os.IBinder
import android.os.PowerManager
import `in`.focuslife.app.R
import `in`.focuslife.app.data.AppDatabase
import `in`.focuslife.app.data.FocusSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class FocusTimerService : Service() {
    private var timer: CountDownTimer? = null
    private var wakeLock: PowerManager.WakeLock? = null

    companion object {
        const val ACTION_START = "in.focuslife.app.START"
        const val ACTION_PAUSE = "in.focuslife.app.PAUSE"
        const val ACTION_RESUME = "in.focuslife.app.RESUME"
        const val ACTION_STOP = "in.focuslife.app.STOP"
        const val EXTRA_MINUTES = "minutes"
        const val EXTRA_TASK = "task"
        const val EXTRA_MODE = "mode"

        var remainingSeconds: Int = 0
        var isRunning: Boolean = false
        var isPaused: Boolean = false
        var plannedMinutes: Int = 0
        var taskTitle: String = ""
        var mode: String = "deep_focus"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        NotificationHelper.ensureChannels(this)
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FocusLife::FocusTimer")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val minutes = intent.getIntExtra(EXTRA_MINUTES, 25)
                val task = intent.getStringExtra(EXTRA_TASK) ?: ""
                val mode = intent.getStringExtra(EXTRA_MODE) ?: "deep_focus"
                startTimer(minutes, task, mode)
            }
            ACTION_PAUSE -> pauseTimer()
            ACTION_RESUME -> resumeTimer()
            ACTION_STOP -> stopTimer(finished = false)
        }
        return START_NOT_STICKY
    }

    private fun startTimer(minutes: Int, task: String, mode: String) {
        stopTimer(finished = false, silent = true)
        plannedMinutes = minutes
        taskTitle = task
        FocusTimerService.mode = mode
        remainingSeconds = minutes * 60
        isRunning = true
        isPaused = false
        if (wakeLock?.isHeld == true) wakeLock?.release()
        wakeLock?.acquire(60 * 60 * 1000L)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NotificationHelper.NOTIF_FOCUS_ID, buildNotification("Focusing: $task — ${format(remainingSeconds)}"))
        } else {
            @Suppress("DEPRECATION")
            startForeground(NotificationHelper.NOTIF_FOCUS_ID, buildNotification("Focusing: $task — ${format(remainingSeconds)}"))
        }
        timer = object : CountDownTimer(remainingSeconds * 1000L, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                remainingSeconds = ((millisUntilFinished + 999) / 1000).toInt()
                if (remainingSeconds % 30 == 0 || remainingSeconds <= 10) {
                    NotificationHelper.focusNotification(this@FocusTimerService, "Focusing — ${format(remainingSeconds)} remaining")
                }
            }
            override fun onFinish() {
                completeSession(minutes, task, mode)
            }
        }.start()
    }

    private fun buildNotification(text: String): android.app.Notification {
        val builder = androidx.core.app.NotificationCompat.Builder(this, NotificationHelper.CHANNEL_FOCUS)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("FOCUS LIFE — Focus Timer")
            .setContentText(text)
            .setOngoing(true)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_LOW)
        return builder.build()
    }

    private fun pauseTimer() {
        if (!isRunning || isPaused) return
        timer?.cancel()
        isPaused = true
        NotificationHelper.focusNotification(this, "Paused — ${format(remainingSeconds)} remaining")
    }

    private fun resumeTimer() {
        if (!isRunning || !isPaused) return
        isPaused = false
        timer = object : CountDownTimer(remainingSeconds * 1000L, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                remainingSeconds = ((millisUntilFinished + 999) / 1000).toInt()
                if (remainingSeconds % 30 == 0 || remainingSeconds <= 10) {
                    NotificationHelper.focusNotification(this@FocusTimerService, "Focusing — ${format(remainingSeconds)} remaining")
                }
            }
            override fun onFinish() {
                completeSession(plannedMinutes, taskTitle, mode)
            }
        }.start()
    }

    private fun completeSession(plannedMinutes: Int, task: String, mode: String) {
        isRunning = false
        isPaused = false
        remainingSeconds = 0
        FocusTimerService.plannedMinutes = 0
        FocusTimerService.taskTitle = ""
        FocusTimerService.mode = "deep_focus"
        if (wakeLock?.isHeld == true) wakeLock?.release()
        NotificationHelper.cancelFocus(this)
        NotificationHelper.reminderNotification(this, "FOCUS LIFE", getString(R.string.notification_focus_done))
        CoroutineScope(Dispatchers.IO).launch {
            val db = AppDatabase.getInstance(this@FocusTimerService)
            val date = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
            db.focusSessionDao().insert(
                FocusSession(
                    date = date,
                    taskTitle = task,
                    plannedMinutes = plannedMinutes,
                    actualMinutes = plannedMinutes,
                    completed = true,
                    mode = mode,
                    startedAt = System.currentTimeMillis()
                )
            )
        }
        stopForeground(true)
        stopSelf()
    }

    private fun stopTimer(finished: Boolean, silent: Boolean = false) {
        timer?.cancel()
        timer = null
        if (!silent) {
            isRunning = false
            isPaused = false
            remainingSeconds = 0
            plannedMinutes = 0
            taskTitle = ""
            mode = "deep_focus"
            if (wakeLock?.isHeld == true) wakeLock?.release()
            NotificationHelper.cancelFocus(this)
            stopForeground(true)
            stopSelf()
        }
    }

    private fun format(seconds: Int): String {
        val m = seconds / 60
        val s = seconds % 60
        return String.format("%02d:%02d", m, s)
    }

    override fun onDestroy() {
        timer?.cancel()
        if (wakeLock?.isHeld == true) wakeLock?.release()
        super.onDestroy()
    }
}
