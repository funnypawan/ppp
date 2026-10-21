package com.ronny.assistant.alarm;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;

import com.ronny.assistant.R;

/** Plays the pleasant reminder tone. Bundled tones work with no internet. */
public final class SoundPlayer {

    public static final String CHIME = "chime";
    public static final String BELL = "bell";
    public static final String SUNRISE = "sunrise";
    public static final String SYSTEM_ALARM = "system_alarm";
    public static final String SYSTEM_NOTIFICATION = "system_notification";
    public static final String SILENT = "silent";

    public static final String[] KEYS = {CHIME, BELL, SUNRISE, SYSTEM_ALARM, SYSTEM_NOTIFICATION, SILENT};

    private static MediaPlayer player;
    private static Ringtone ringtone;

    private SoundPlayer() {
    }

    public static String[] labels(Context context) {
        return new String[]{
                context.getString(R.string.sound_chime),
                context.getString(R.string.sound_bell),
                context.getString(R.string.sound_sunrise),
                context.getString(R.string.sound_system_alarm),
                context.getString(R.string.sound_system_notification),
                context.getString(R.string.sound_silent)
        };
    }

    public static String label(Context context, String key) {
        String[] keys = KEYS;
        String[] labels = labels(context);
        if (key == null) {
            return labels[0];
        }
        for (int i = 0; i < keys.length; i++) {
            if (keys[i].equals(key)) {
                return labels[i];
            }
        }
        // Anything that is not a built-in key is treated as a picked ringtone URI.
        return "Custom sound";
    }

    public static int rawResId(String key) {
        if (BELL.equals(key)) {
            return R.raw.bell;
        }
        if (SUNRISE.equals(key)) {
            return R.raw.sunrise_pad;
        }
        return R.raw.chime;
    }

    /** Plays the tone once. Any previously playing tone is stopped first. */
    public static synchronized void play(Context context, String key, float volume) {
        stop();
        if (key == null || SILENT.equals(key)) {
            return;
        }
        try {
            if (SYSTEM_ALARM.equals(key) || SYSTEM_NOTIFICATION.equals(key)) {
                int type = SYSTEM_ALARM.equals(key)
                        ? RingtoneManager.TYPE_ALARM : RingtoneManager.TYPE_NOTIFICATION;
                Uri uri = RingtoneManager.getDefaultUri(type);
                if (uri == null) {
                    return;
                }
                Ringtone r = RingtoneManager.getRingtone(context, uri);
                if (r == null) {
                    return;
                }
                AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(SYSTEM_ALARM.equals(key)
                                ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_NOTIFICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                r.setAudioAttributes(attrs);
                r.play();
                ringtone = r;
                return;
            }

            int resId = rawResId(key);
            MediaPlayer mp = MediaPlayer.create(context, resId);
            if (mp == null) {
                return;
            }
            mp.setAudioAttributes(new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            mp.setVolume(volume, volume);
            mp.setLooping(false);
            mp.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                public void onCompletion(MediaPlayer mediaPlayer) {
                    stop();
                }
            });
            player = mp;
            mp.start();
        } catch (Throwable t) {
            // Never let audio problems block the reminder.
        }
    }

    public static synchronized void stop() {
        try {
            if (player != null) {
                if (player.isPlaying()) {
                    player.stop();
                }
                player.release();
            }
        } catch (Throwable ignored) {
        } finally {
            player = null;
        }
        try {
            if (ringtone != null && ringtone.isPlaying()) {
                ringtone.stop();
            }
        } catch (Throwable ignored) {
        } finally {
            ringtone = null;
        }
    }
}
