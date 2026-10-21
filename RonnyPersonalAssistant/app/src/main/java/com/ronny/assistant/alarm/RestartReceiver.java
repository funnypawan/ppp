package com.ronny.assistant.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.ronny.assistant.data.RoutineDb;

/**
 * Keeps the schedule alive across the moments Android forgets it.
 *
 * <ul>
 *   <li>After a reboot (BOOT_COMPLETED / LOCKED_BOOT_COMPLETED)</li>
 *   <li>After the app is updated (MY_PACKAGE_REPLACED)</li>
 *   <li>When the clock, date or time zone changes</li>
 *   <li>When the user grants or revokes the exact-alarm permission</li>
 * </ul>
 *
 * In every case we simply re-arm the alarms from the local database, which is
 * why the routine keeps working with no internet connection.
 */
public class RestartReceiver extends BroadcastReceiver {

    public static final String ACTION_RESCAN = "com.ronny.assistant.ACTION_RESCAN";

    @Override
    public void onReceive(Context context, Intent intent) {
        Notifier.createChannels(context);
        // Touching the database makes sure it exists and is seeded.
        RoutineDb.get(context).all();
        AlarmScheduler.rescheduleAll(context);
    }
}
