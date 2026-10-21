package com.ronny.assistant.alarm;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;

/**
 * Plays the pleasant tone, speaks the Hindi message and keeps the notification
 * on screen while a reminder is active.
 *
 * <p>It runs as a foreground service of type {@code mediaPlayback}, which is
 * the correct, permission-light way to keep audio going after the alarm fires.
 * Exact alarms are exempt from Android 12's background-start restriction, so
 * starting this from {@link AlarmReceiver} is allowed.</p>
 */
public class ReminderService extends Service {

    private static final String TAG = "RonnyReminder";

    public static final String ACTION_START = "com.ronny.assistant.ACTION_START_REMINDER";
    public static final String ACTION_STOP = "com.ronny.assistant.ACTION_STOP_REMINDER";
    public static final String EXTRA_ITEM_ID = "item_id";

    /** How long the reminder keeps ringing before it politely stops itself. */
    private static final long AUTO_STOP_MS = 2 * 60 * 1000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private RoutineItem current;
    private boolean speakAfterTone = true;

    public static void start(Context context, long itemId) {
        Intent i = new Intent(context, ReminderService.class);
        i.setAction(ACTION_START);
        i.putExtra(EXTRA_ITEM_ID, itemId);
        try {
            if (Build.VERSION.SDK_INT >= 26) {
                context.startForegroundService(i);
            } else {
                context.startService(i);
            }
        } catch (Throwable t) {
            Log.e(TAG, "startForegroundService refused", t);
        }
    }

    public static void stop(Context context) {
        Intent i = new Intent(context, ReminderService.class);
        i.setAction(ACTION_STOP);
        try {
            context.startService(i);
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Notifier.createChannels(this);
        Speech.get(this);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();
        if (ACTION_STOP.equals(action)) {
            finish();
            return START_NOT_STICKY;
        }
        long id = intent == null ? -1L : intent.getLongExtra(EXTRA_ITEM_ID, -1L);
        RoutineItem item = id > 0 ? RoutineDb.get(this).get(id) : null;
        if (item == null) {
            finish();
            return START_NOT_STICKY;
        }
        begin(item);
        return START_STICKY;
    }

    private void begin(RoutineItem item) {
        boolean sameItem = current != null && current.id == item.id;
        current = item;
        speakAfterTone = true;
        if (sameItem) {
            // Already ringing for this activity (for example the full-screen
            // screen opened right after the alarm). Keep the sound running.
            handler.removeCallbacks(stopRunnable);
            handler.postDelayed(stopRunnable, AUTO_STOP_MS);
            return;
        }

        Notification playback = Notifier.buildPlayback(this, item);
        try {
            if (Build.VERSION.SDK_INT >= 29) {
                startForeground(Notifier.ID_PLAYBACK, playback,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(Notifier.ID_PLAYBACK, playback);
            }
        } catch (Throwable t) {
            Log.e(TAG, "startForeground failed", t);
        }

        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.notify(Notifier.itemNotificationId(item.id),
                    Notifier.buildReminder(this, item, true));
        }

        Prefs prefs = Prefs.get(this);
        int behaviour = prefs.behaviour();
        float volume = prefs.volumeFraction();

        boolean playSound = behaviour == Prefs.BEHAVIOUR_SOUND_VOICE
                || behaviour == Prefs.BEHAVIOUR_SOUND_ONLY;
        boolean speak = (behaviour == Prefs.BEHAVIOUR_SOUND_VOICE
                || behaviour == Prefs.BEHAVIOUR_VOICE_ONLY)
                && prefs.voiceEnabled() && item.voice;

        if (playSound) {
            SoundPlayer.play(this, item.sound, volume);
        }

        if (speak) {
            final Runnable afterSpeaking = new Runnable() {
                @Override
                public void run() {
                    handler.post(stopRunnable);
                }
            };
            // A short pause lets the tone register before the voice starts.
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (!speakAfterTone || current == null) {
                        return;
                    }
                    Prefs prefs = Prefs.get(ReminderService.this);
                    Speech.get(ReminderService.this)
                            .speak(current.spokenText(prefs.userName()),
                                    prefs.volumeFraction(), afterSpeaking);
                }
            }, playSound ? 900L : 120L);
        }

        handler.removeCallbacks(stopRunnable);
        handler.postDelayed(stopRunnable, AUTO_STOP_MS);
    }

    private final Runnable stopRunnable = new Runnable() {
        @Override
        public void run() {
            finish();
        }
    };

    private void finish() {
        speakAfterTone = false;
        handler.removeCallbacks(stopRunnable);
        try {
            SoundPlayer.stop();
        } catch (Throwable ignored) {
        }
        try {
            Speech.get(this).stop();
        } catch (Throwable ignored) {
        }
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && current != null) {
                // Replace the ongoing card with a dismissible one so the
                // reminder stays visible after the sound has finished.
                nm.notify(Notifier.itemNotificationId(current.id),
                        Notifier.buildReminder(this, current, false));
            }
        } catch (Throwable ignored) {
        }
        current = null;
        if (Build.VERSION.SDK_INT >= 24) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(stopRunnable);
        try {
            SoundPlayer.stop();
        } catch (Throwable ignored) {
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
