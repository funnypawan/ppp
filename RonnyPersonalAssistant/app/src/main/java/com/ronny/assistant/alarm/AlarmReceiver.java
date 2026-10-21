package com.ronny.assistant.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.app.NotificationManager;
import android.content.Intent;
import android.os.PowerManager;
import android.util.Log;

import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;

/**
 * Fires when the phone's alarm clock goes off for one activity.
 *
 * Duplicate protection: the schedule is guarded by {@link RoutineDb#isFired}
 * so a reboot, a clock change or an extra reschedule pass can never make the
 * same event ring twice.
 */
public class AlarmReceiver extends BroadcastReceiver {

    private static final String TAG = "RonnyAlarm";
    private static final String WAKE_TAG = "ronny:reminder";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) {
            return;
        }
        long id = intent.getLongExtra(AlarmScheduler.EXTRA_ITEM_ID, -1L);
        if (id < 0) {
            return;
        }
        boolean snoozed = intent.getBooleanExtra(AlarmScheduler.EXTRA_SNOOZED, false);

        Prefs prefs = Prefs.get(context);
        RoutineDb db = RoutineDb.get(context);
        RoutineItem item = db.get(id);
        if (item == null || !item.enabled) {
            return;
        }
        if (!prefs.masterEnabled()) {
            return;
        }

        String day = TimeUtils.dayKey();
        if (!snoozed && db.isFired(day, id)) {
            // Already announced today - a duplicate schedule pass, ignore it.
            Log.i(TAG, "Duplicate suppressed for " + item.title);
            return;
        }
        if (snoozed) {
            // Allow the reminder to ring again after the snooze window.
            db.clearFired(day, id);
        }
        db.markFired(day, id);

        PowerManager.WakeLock lock = acquireWakeLock(context);
        try {
            ReminderService.start(context, id);
        } catch (Throwable t) {
            Log.e(TAG, "Could not start the reminder service", t);
            // Last resort: at least show the notification so Ronny still sees it.
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.notify(Notifier.itemNotificationId(id),
                        Notifier.buildReminder(context, item, false));
            }
        } finally {
            releaseWakeLock(lock);
        }

        // Re-arm the next occurrence so tomorrow keeps working.
        AlarmScheduler.scheduleItem(context, item);
    }

    private static PowerManager.WakeLock acquireWakeLock(Context context) {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm == null) {
                return null;
            }
            PowerManager.WakeLock lock = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK, WAKE_TAG);
            lock.acquire(20000L);
            return lock;
        } catch (Throwable t) {
            return null;
        }
    }

    private static void releaseWakeLock(PowerManager.WakeLock lock) {
        try {
            if (lock != null && lock.isHeld()) {
                lock.release();
            }
        } catch (Throwable ignored) {
        }
    }

}
