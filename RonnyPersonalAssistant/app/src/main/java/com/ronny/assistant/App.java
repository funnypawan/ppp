package com.ronny.assistant;

import android.app.Application;
import android.content.Context;
import android.util.Log;

import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.Notifier;
import com.ronny.assistant.alarm.Speech;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.util.TimeUtils;

/** Application entry point: prepares storage, channels and the alarm schedule. */
public class App extends Application {

    private static final String TAG = "RonnyApp";

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            Notifier.createChannels(this);
            // Opens (and on first run seeds) the local routine database.
            RoutineDb.get(this).all();
            onDayChanged(this);
            AlarmScheduler.rescheduleAll(this);
            // Warm the speech engine up so the first reminder speaks promptly.
            Speech.get(this);
        } catch (Throwable t) {
            Log.e(TAG, "Startup failed", t);
        }
    }

    /**
     * Clears the "already rang" markers when the local date changes so every
     * activity can ring again tomorrow. Cheap to call as often as you like.
     */
    public static void onDayChanged(Context context) {
        Prefs prefs = Prefs.get(context);
        String today = TimeUtils.dayKey();
        if (!today.equals(prefs.lastDay())) {
            RoutineDb.get(context).clearFiredDay(today);
            prefs.setLastDay(today);
            AlarmScheduler.rescheduleAll(context);
        }
    }
}
