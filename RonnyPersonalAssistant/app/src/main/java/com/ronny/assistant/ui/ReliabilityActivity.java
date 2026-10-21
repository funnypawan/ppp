package com.ronny.assistant.ui;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.Speech;
import com.ronny.assistant.util.Ui;

/**
 * Explains the handful of Android settings that decide whether reminders can
 * ring exactly on time, and lets Ronny open each one.
 *
 * Nothing here pretends the phone can be forced: if a permission is off we say
 * so plainly and link to the setting that fixes it.
 */
public class ReliabilityActivity extends Activity {

    private LinearLayout container;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reliability);
        container = findViewById(R.id.container);

        findViewById(R.id.btn_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        build();
    }

    @Override
    protected void onResume() {
        super.onResume();
        build();
    }

    private void build() {
        container.removeAllViews();

        add(R.drawable.ic_bell, getString(R.string.rel_notifications),
                getString(R.string.rel_notifications_desc),
                Permissions.notificationsGranted(this),
                Build.VERSION.SDK_INT >= 33 ? Permissions.notificationSettingsIntent(this) : null,
                Build.VERSION.SDK_INT < 33);
        Ui.divider(this, container);

        add(R.drawable.ic_alarm, getString(R.string.rel_exact),
                getString(R.string.rel_exact_desc),
                Permissions.exactAlarmsGranted(this),
                Permissions.exactAlarmSettingsIntent(this),
                Build.VERSION.SDK_INT < 31);
        Ui.divider(this, container);

        add(R.drawable.ic_battery, getString(R.string.rel_battery),
                getString(R.string.rel_battery_desc),
                Permissions.batteryOptimizationIgnored(this),
                Permissions.batterySettingsIntent(this),
                Build.VERSION.SDK_INT < 23);
        Ui.divider(this, container);

        add(R.drawable.ic_shield, getString(R.string.rel_autostart),
                getString(R.string.rel_autostart_desc),
                true, Permissions.appDetailsIntent(this), false);
        Ui.divider(this, container);

        add(R.drawable.ic_mic, getString(R.string.rel_tts),
                getString(R.string.rel_tts_desc),
                Speech.get(this).isLanguageAvailable(),
                Speech.ttsSettingsIntent(), false);
    }

    private void add(int icon, String title, String description, boolean ok,
                     final Intent fixIntent, boolean notRequired) {
        String state;
        int color;
        if (notRequired) {
            state = getString(R.string.rel_state_unknown);
            color = R.color.text_muted;
        } else if (ok) {
            state = getString(R.string.rel_state_ok);
            color = R.color.success;
        } else {
            state = getString(R.string.rel_state_todo);
            color = R.color.accent_warm;
        }

        TextView status = new TextView(this);
        status.setText(state);
        status.setTextColor(getResources().getColor(color));
        status.setTextSize(11f);
        status.setTypeface(null, android.graphics.Typeface.BOLD);

        View.OnClickListener click = null;
        if (fixIntent != null) {
            click = new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    Permissions.safeStart(ReliabilityActivity.this, fixIntent);
                }
            };
        }
        Ui.addRow(this, container, icon, title, description, status, click);
    }
}
