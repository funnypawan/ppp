package com.ronny.assistant.ui;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.data.Prefs;

/**
 * Everything to do with asking for - and explaining - the handful of
 * permissions Android needs before reminders can be trusted.
 *
 * The app deliberately requests nothing else: no location, no contacts,
 * no storage, no microphone.
 */
public final class Permissions {

    public static final int REQ_NOTIFICATION = 4101;

    private Permissions() {
    }

    /** POST_NOTIFICATIONS, required from Android 13 (API 33). */
    public static boolean notificationsGranted(Context context) {
        if (Build.VERSION.SDK_INT < 33) {
            return true;
        }
        return context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    public static void askNotificationPermission(Activity activity) {
        if (Build.VERSION.SDK_INT < 33) {
            return;
        }
        if (notificationsGranted(activity)) {
            return;
        }
        if (activity.shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
            new AlertDialog.Builder(activity)
                    .setTitle(R.string.rel_notifications)
                    .setMessage(R.string.permission_rationale)
                    .setPositiveButton(R.string.ok, new android.content.DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(android.content.DialogInterface d, int which) {
                            requestNotifications(activity);
                        }
                    })
                    .setNegativeButton(R.string.cancel, null)
                    .show();
            return;
        }
        requestNotifications(activity);
    }

    private static void requestNotifications(Activity activity) {
        if (Build.VERSION.SDK_INT >= 33) {
            activity.requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIFICATION);
        }
    }

    /** Android 12+ "Alarms & reminders" special access. */
    public static boolean exactAlarmsGranted(Context context) {
        return AlarmScheduler.canScheduleExact(context);
    }

    public static Intent exactAlarmSettingsIntent(Context context) {
        if (Build.VERSION.SDK_INT >= 31) {
            Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            i.setData(Uri.parse("package:" + context.getPackageName()));
            return i;
        }
        return appDetailsIntent(context);
    }

    public static boolean batteryOptimizationIgnored(Context context) {
        if (Build.VERSION.SDK_INT < 23) {
            return true;
        }
        PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
        return pm != null && pm.isIgnoringBatteryOptimizations(context.getPackageName());
    }

    public static Intent batterySettingsIntent(Context context) {
        if (Build.VERSION.SDK_INT >= 23) {
            Intent i = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            i.setData(Uri.parse("package:" + context.getPackageName()));
            return i;
        }
        return appDetailsIntent(context);
    }

    /** Android 14+ full-screen notification access (best effort only). */
    public static boolean fullScreenIntentGranted(Context context) {
        if (Build.VERSION.SDK_INT < 34) {
            return true;
        }
        android.app.NotificationManager nm =
                context.getSystemService(android.app.NotificationManager.class);
        return nm != null && nm.canUseFullScreenIntent();
    }

    public static Intent fullScreenSettingsIntent(Context context) {
        if (Build.VERSION.SDK_INT >= 34) {
            return new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:" + context.getPackageName()));
        }
        return appDetailsIntent(context);
    }

    /** OEM auto-start / app-info page, the only generic handle most phones expose. */
    public static Intent appDetailsIntent(Context context) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        i.setData(Uri.parse("package:" + context.getPackageName()));
        return i;
    }

    public static Intent notificationSettingsIntent(Context context) {
        if (Build.VERSION.SDK_INT >= 26) {
            return new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, context.getPackageName());
        }
        return appDetailsIntent(context);
    }

    public static void safeStart(android.app.Activity activity, Intent intent) {
        if (intent == null) {
            return;
        }
        try {
            activity.startActivity(intent);
        } catch (Throwable t) {
            Toast.makeText(activity, R.string.rel_state_unknown, Toast.LENGTH_SHORT).show();
        }
    }

    /** First launch: explain what is needed, then jump to the reliability screen. */
    public static void showFirstRunHelp(android.app.Activity activity) {
        Prefs prefs = Prefs.get(activity);
        if (prefs.onboarded()) {
            return;
        }
        prefs.setOnboarded(true);
        new AlertDialog.Builder(activity)
                .setTitle(R.string.rel_title)
                .setMessage(R.string.rel_intro)
                .setPositiveButton(R.string.rel_open, new android.content.DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(android.content.DialogInterface d, int which) {
                        activity.startActivity(new Intent(activity, ReliabilityActivity.class));
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }
}
