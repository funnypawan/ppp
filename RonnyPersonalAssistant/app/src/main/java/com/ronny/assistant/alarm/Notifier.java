package com.ronny.assistant.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import com.ronny.assistant.R;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.ui.AlarmActivity;
import com.ronny.assistant.util.TimeUtils;

/** Creates the notification channels and every notification the app shows. */
public final class Notifier {

    public static final String CHANNEL_REMINDERS = "ronny_reminders";
    public static final String CHANNEL_PLAYBACK = "ronny_playback";
    public static final String CHANNEL_GENERAL = "ronny_general";

    public static final int ID_PLAYBACK = 7001;

    private Notifier() {
    }

    public static void createChannels(Context context) {
        if (Build.VERSION.SDK_INT < 26) {
            return;
        }
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) {
            return;
        }

        NotificationChannel reminders = new NotificationChannel(
                CHANNEL_REMINDERS,
                context.getString(R.string.notif_channel_reminders),
                NotificationManager.IMPORTANCE_HIGH);
        reminders.setDescription(context.getString(R.string.notif_channel_reminders_desc));
        reminders.enableVibration(true);
        reminders.setSound(null, null);
        reminders.setBypassDnd(true);
        reminders.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(reminders);

        NotificationChannel playback = new NotificationChannel(
                CHANNEL_PLAYBACK,
                context.getString(R.string.notif_channel_service),
                NotificationManager.IMPORTANCE_LOW);
        playback.setDescription(context.getString(R.string.notif_channel_service_desc));
        playback.setSound(null, null);
        nm.createNotificationChannel(playback);

        NotificationChannel general = new NotificationChannel(
                CHANNEL_GENERAL,
                context.getString(R.string.notif_channel_general),
                NotificationManager.IMPORTANCE_LOW);
        general.setSound(null, null);
        nm.createNotificationChannel(general);
    }

    /** Notification id used for a routine activity's alert. */
    public static int itemNotificationId(long itemId) {
        return 10000 + (int) (itemId % 9000L);
    }

    private static int flags() {
        int f = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) {
            f |= PendingIntent.FLAG_IMMUTABLE;
        }
        return f;
    }

    public static PendingIntent contentIntent(Context context, RoutineItem item) {
        Intent i = new Intent(context, AlarmActivity.class);
        i.setAction(AlarmActivity.ACTION_SHOW);
        i.putExtra(AlarmActivity.EXTRA_ITEM_ID, item.id);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, (int) item.id, i, flags());
    }

    private static PendingIntent actionIntent(Context context, long itemId, String action) {
        Intent i = new Intent(context, ActionReceiver.class);
        i.setAction(action);
        i.putExtra(ActionReceiver.EXTRA_ITEM_ID, itemId);
        return PendingIntent.getBroadcast(context, (int) (itemId % 30000L) + action.hashCode(),
                i, flags());
    }

    /** The loud reminder card with Done and Snooze buttons. */
    public static Notification buildReminder(Context context, RoutineItem item, boolean ongoing) {
        String title = item.title == null ? "" : item.title;
        String body = item.message == null || item.message.length() == 0
                ? title : item.message;
        String text = TimeUtils.format(context, item.startMin) + "  •  " + body;

        Notification.Builder b = new Notification.Builder(context, CHANNEL_REMINDERS)
                .setSmallIcon(R.drawable.ic_stat_bell)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle()
                        .setBigContentTitle(title)
                        .bigText(text))
                .setCategory(Notification.CATEGORY_ALARM)
                .setVisibility(Notification.VISIBILITY_PUBLIC)
                .setPriority(Notification.PRIORITY_MAX)
                .setAutoCancel(!ongoing)
                .setOngoing(ongoing)
                .setContentIntent(contentIntent(context, item))
                .addAction(new Notification.Action.Builder(
                        R.drawable.ic_check,
                        context.getString(R.string.notif_done),
                        actionIntent(context, item.id, ActionReceiver.ACTION_DONE)).build())
                .addAction(new Notification.Action.Builder(
                        R.drawable.ic_alarm,
                        context.getString(R.string.notif_snooze),
                        actionIntent(context, item.id, ActionReceiver.ACTION_SNOOZE)).build());

        // Full-screen alarm UI: only used when the phone has granted the
        // permission (Android 14+ may withhold it), otherwise Android simply
        // shows a heads-up notification instead.
        if (canUseFullScreen(context)) {
            b.setFullScreenIntent(contentIntent(context, item), true);
        }
        return b.build();
    }

    private static boolean canUseFullScreen(Context context) {
        if (Build.VERSION.SDK_INT < 34) {
            return true;
        }
        try {
            NotificationManager nm = context.getSystemService(NotificationManager.class);
            return nm != null && nm.canUseFullScreenIntent();
        } catch (Throwable t) {
            return false;
        }
    }

    /** Sticky notification shown while the sound and voice are playing. */
    public static Notification buildPlayback(Context context, RoutineItem item) {
        return new Notification.Builder(context, CHANNEL_PLAYBACK)
                .setSmallIcon(R.drawable.ic_stat_bell)
                .setContentTitle(item == null ? context.getString(R.string.app_name) : item.title)
                .setContentText(context.getString(R.string.notif_playing))
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setContentIntent(item == null ? null : contentIntent(context, item))
                .build();
    }

    public static void notifySnoozed(Context context, RoutineItem item, long when) {
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null) {
            return;
        }
        int minutes = Prefs.get(context).snoozeMinutes();
        Notification n = new Notification.Builder(context, CHANNEL_GENERAL)
                .setSmallIcon(R.drawable.ic_stat_bell)
                .setContentTitle(context.getString(R.string.notif_snoozed_title, item.title))
                .setContentText(context.getString(R.string.notif_snoozed_text,
                        TimeUtils.format(context, minutesAfter(when, minutes))))
                .setAutoCancel(true)
                .setContentIntent(contentIntent(context, item))
                .build();
        nm.notify(itemNotificationId(item.id), n);
    }

    private static int minutesAfter(long when, int minutes) {
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.setTimeInMillis(when + minutes * 60000L);
        return c.get(java.util.Calendar.HOUR_OF_DAY) * 60 + c.get(java.util.Calendar.MINUTE);
    }

    public static void cancel(Context context, long itemId) {
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm != null) {
            nm.cancel(itemNotificationId(itemId));
        }
    }
}
