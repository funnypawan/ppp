package com.ronny.assistant.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;
import android.util.Log;

import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;

import java.util.List;

/**
 * Arms the phone's real alarm clock for every enabled routine activity.
 *
 * <p>Each activity owns exactly one PendingIntent keyed by its database id, so
 * scheduling twice replaces the previous alarm instead of creating a duplicate.
 * Snoozing uses the same key with a one-shot elapsed-time alarm, which is why
 * {@link #cancelSnooze} can always find it again.</p>
 */
public final class AlarmScheduler {

    private static final String TAG = "RonnyScheduler";

    public static final String ACTION_REMIND = "com.ronny.assistant.ACTION_REMIND";
    public static final String EXTRA_ITEM_ID = "item_id";
    public static final String EXTRA_SNOOZED = "snoozed";

    /** Prefix used for the temporary snooze alarm request codes. */
    private static final int SNOOZE_OFFSET = 500000;

    private AlarmScheduler() {
    }

    public static AlarmManager alarms(Context context) {
        Object o = context.getSystemService(Context.ALARM_SERVICE);
        return o instanceof AlarmManager ? (AlarmManager) o : null;
    }

    private static int flags() {
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) {
            f |= PendingIntent.FLAG_IMMUTABLE;
        }
        return f;
    }

    public static PendingIntent remindIntent(Context context, long itemId, boolean snoozed) {
        Intent i = new Intent(context, AlarmReceiver.class);
        i.setAction(ACTION_REMIND);
        i.putExtra(EXTRA_ITEM_ID, itemId);
        i.putExtra(EXTRA_SNOOZED, snoozed);
        int requestCode = snoozed ? (int) (SNOOZE_OFFSET + itemId) : (int) itemId;
        return PendingIntent.getBroadcast(context, requestCode, i, flags());
    }

    /** True when the phone lets us fire at an exact minute. */
    public static boolean canScheduleExact(Context context) {
        if (Build.VERSION.SDK_INT < 31) {
            return true;
        }
        AlarmManager am = alarms(context);
        return am != null && am.canScheduleExactAlarms();
    }

    /**
     * (Re)arms every enabled activity. Safe to call as often as you like:
     * it is idempotent because the PendingIntent request codes are stable.
     */
    public static synchronized void rescheduleAll(Context context) {
        AlarmManager am = alarms(context);
        if (am == null) {
            return;
        }
        Prefs prefs = Prefs.get(context);
        if (!prefs.masterEnabled()) {
            cancelAll(context);
            return;
        }
        long now = System.currentTimeMillis();
        List<RoutineItem> items = RoutineDb.get(context).all();
        for (RoutineItem item : items) {
            if (item.enabled) {
                scheduleItem(context, am, item, now);
            } else {
                cancelItem(context, am, item.id);
            }
        }
        Log.i(TAG, "Scheduled " + items.size() + " activities");
    }

    public static void scheduleItem(Context context, RoutineItem item) {
        scheduleItem(context, alarms(context), item, System.currentTimeMillis());
    }

    private static void scheduleItem(Context context, AlarmManager am, RoutineItem item, long now) {
        if (am == null || item == null) {
            return;
        }
        PendingIntent pi = remindIntent(context, item.id, false);
        long trigger = item.nextTrigger(now).getTimeInMillis();

        if (canScheduleExact(context)) {
            // setAlarmClock is treated by Android as a user-visible alarm: it is
            // exempt from Doze restrictions and shows the alarm icon.
            try {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(trigger, pi), pi);
            } catch (Throwable t) {
                fallbackSet(am, trigger, pi);
            }
        } else {
            // The phone denied "Alarms & reminders". Be honest: fire as close as
            // Android allows and let the reliability screen explain the fix.
            am.set(AlarmManager.RTC_WAKEUP, trigger, pi);
        }
    }

    private static void fallbackSet(AlarmManager am, long trigger, PendingIntent pi) {
        try {
            if (Build.VERSION.SDK_INT >= 23) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            } else {
                am.setExact(AlarmManager.RTC_WAKEUP, trigger, pi);
            }
        } catch (Throwable ignored) {
        }
    }

    public static void cancelItem(Context context, long itemId) {
        cancelItem(context, alarms(context), itemId);
    }

    private static void cancelItem(Context context, AlarmManager am, long itemId) {
        if (am == null) {
            return;
        }
        am.cancel(remindIntent(context, itemId, false));
    }

    public static void cancelAll(Context context) {
        AlarmManager am = alarms(context);
        if (am == null) {
            return;
        }
        List<RoutineItem> items = RoutineDb.get(context).all();
        for (RoutineItem item : items) {
            cancelItem(context, am, item.id);
            cancelSnooze(context, item.id);
        }
    }

    /** ------------------------------------------------------------- snooze */

    public static void scheduleSnooze(Context context, long itemId, int minutes) {
        AlarmManager am = alarms(context);
        if (am == null) {
            return;
        }
        long trigger = SystemClock.elapsedRealtime() + minutes * 60000L;
        PendingIntent pi = remindIntent(context, itemId, true);
        if (canScheduleExact(context)) {
            try {
                am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger, pi);
                return;
            } catch (Throwable ignored) {
            }
        }
        am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, trigger, pi);
    }

    public static void cancelSnooze(Context context, long itemId) {
        AlarmManager am = alarms(context);
        if (am == null) {
            return;
        }
        am.cancel(remindIntent(context, itemId, true));
    }

    /** Arms a short "check the schedule" alarm; used after boot and time changes. */
    public static void scheduleSelfHeal(Context context) {
        AlarmManager am = alarms(context);
        if (am == null) {
            return;
        }
        Intent i = new Intent(context, RestartReceiver.class);
        i.setAction(RestartReceiver.ACTION_RESCAN);
        PendingIntent pi = PendingIntent.getBroadcast(context, 424242, i, flags());
        try {
            am.set(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + 60000L, pi);
        } catch (Throwable ignored) {
        }
    }
}
