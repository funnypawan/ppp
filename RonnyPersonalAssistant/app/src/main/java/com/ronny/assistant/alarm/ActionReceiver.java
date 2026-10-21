package com.ronny.assistant.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;

import java.util.Calendar;

/** Handles the Done and Snooze buttons on the reminder notification. */
public class ActionReceiver extends BroadcastReceiver {

    public static final String ACTION_DONE = "com.ronny.assistant.ACTION_DONE";
    public static final String ACTION_SNOOZE = "com.ronny.assistant.ACTION_SNOOZE";
    public static final String EXTRA_ITEM_ID = "item_id";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) {
            return;
        }
        long id = intent.getLongExtra(EXTRA_ITEM_ID, -1L);
        String action = intent.getAction();
        if (id < 0) {
            return;
        }
        RoutineItem item = RoutineDb.get(context).get(id);
        if (item == null) {
            return;
        }

        if (ACTION_DONE.equals(action)) {
            RoutineDb.get(context).markDone(TimeUtils.dayKey(), id);
            ReminderService.stop(context);
            AlarmScheduler.cancelSnooze(context, id);
            Notifier.cancel(context, id);
            Toast.makeText(context,
                    context.getString(R.string.alarm_marked_done, Prefs.get(context).userName()),
                    Toast.LENGTH_SHORT).show();
            return;
        }

        if (ACTION_SNOOZE.equals(action)) {
            int minutes = Prefs.get(context).snoozeMinutes();
            ReminderService.stop(context);
            Notifier.cancel(context, id);
            AlarmScheduler.scheduleSnooze(context, id, minutes);
            Calendar next = Calendar.getInstance();
            next.add(Calendar.MINUTE, minutes);
            Notifier.notifySnoozed(context, item, next.getTimeInMillis());
        }
    }
}
