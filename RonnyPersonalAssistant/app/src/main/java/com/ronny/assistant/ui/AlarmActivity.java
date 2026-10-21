package com.ronny.assistant.ui;

import android.app.Activity;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.format.DateFormat;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.ActionReceiver;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.Notifier;
import com.ronny.assistant.alarm.ReminderService;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;

/**
 * The screen Ronny sees when a reminder fires. It is also opened by tapping the
 * notification, so it doubles as the "show the current activity inside the app"
 * view required for every reminder.
 */
public class AlarmActivity extends Activity {

    public static final String ACTION_SHOW = "com.ronny.assistant.ACTION_SHOW_REMINDER";
    public static final String EXTRA_ITEM_ID = "item_id";

    /** Ring for at most two minutes when opened without the service running. */
    private static final long AUTO_CLOSE_MS = 2 * 60 * 1000L;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private RoutineItem item;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        wakeScreen();
        setContentView(R.layout.activity_alarm);
        handle(getIntent());
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handle(intent);
    }

    private void wakeScreen() {
        try {
            getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
                            | WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                            | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                            | WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON);
        } catch (Throwable ignored) {
        }
    }

    private void handle(android.content.Intent intent) {
        long id = intent == null ? -1L : intent.getLongExtra(EXTRA_ITEM_ID, -1L);
        item = id > 0 ? RoutineDb.get(this).get(id) : null;
        if (item == null) {
            // Opened with no id: show whichever activity is current.
            item = com.ronny.assistant.ai.MotivationEngine.nextUp(
                    RoutineDb.get(this).all());
        }
        if (item == null) {
            finish();
            return;
        }
        render();
    }

    private void render() {
        final Prefs prefs = Prefs.get(this);

        TextView label = findViewById(R.id.label);
        TextView emoji = findViewById(R.id.emoji);
        TextView title = findViewById(R.id.title);
        TextView time = findViewById(R.id.time);
        TextView message = findViewById(R.id.message);
        TextView speaking = findViewById(R.id.speaking);

        label.setText(getString(R.string.alarm_ringing) + "  •  " + TimeUtils.longDate());
        emoji.setText(item.emoji);
        title.setText(item.title);
        time.setText(item.timeRangeLabel(DateFormat.is24HourFormat(this)));
        message.setText(item.message);

        boolean silent = prefs.behaviour() == Prefs.BEHAVIOUR_SILENT;
        speaking.setVisibility(silent ? View.GONE : View.VISIBLE);
        speaking.setText(prefs.voiceEnabled() && item.voice
                ? "Hindi voice reminder" : "Sound only");

        findViewById(R.id.btn_done).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                RoutineDb.get(AlarmActivity.this).markDone(TimeUtils.dayKey(), item.id);
                ReminderService.stop(AlarmActivity.this);
                AlarmScheduler.cancelSnooze(AlarmActivity.this, item.id);
                Notifier.cancel(AlarmActivity.this, item.id);
                Toast.makeText(AlarmActivity.this,
                        getString(R.string.alarm_marked_done, prefs.userName()),
                        Toast.LENGTH_SHORT).show();
                finish();
            }
        });

        findViewById(R.id.btn_snooze).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                int minutes = prefs.snoozeMinutes();
                ReminderService.stop(AlarmActivity.this);
                Notifier.cancel(AlarmActivity.this, item.id);
                AlarmScheduler.scheduleSnooze(AlarmActivity.this, item.id, minutes);
                Toast.makeText(AlarmActivity.this,
                        getString(R.string.alarm_snoozed_for, minutes),
                        Toast.LENGTH_SHORT).show();
                finish();
            }
        });

        // Start the sound and the voice if this screen was opened on its own
        // (for example from the dashboard preview or a notification tap).
        if (ACTION_SHOW.equals(getIntent().getAction())) {
            ReminderService.start(AlarmActivity.this, item.id);
        }

        handler.removeCallbacks(autoClose);
        handler.postDelayed(autoClose, AUTO_CLOSE_MS);
    }

    private final Runnable autoClose = new Runnable() {
        @Override
        public void run() {
            finishSafely();
        }
    };

    private void finishSafely() {
        try {
            if (Build.VERSION.SDK_INT >= 21 && !isFinishing()) {
                finish();
            }
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
        // Ringing should continue in the background so Ronny still hears it.
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(autoClose);
        super.onDestroy();
    }

    /** Mirrors the notification action constants so the buttons stay in sync. */
    static String doneAction() {
        return ActionReceiver.ACTION_DONE;
    }
}
