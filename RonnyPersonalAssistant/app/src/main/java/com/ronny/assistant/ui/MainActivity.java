package com.ronny.assistant.ui;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.format.DateFormat;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.ronny.assistant.App;
import com.ronny.assistant.R;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.SoundPlayer;
import com.ronny.assistant.alarm.Speech;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;
import com.ronny.assistant.util.Ui;

import java.util.List;

/** Home dashboard: greeting, live clock, next activity, countdown and today's timeline. */
public class MainActivity extends Activity {

    private final Handler handler = new Handler(Looper.getMainLooper());
    private TextView greeting;
    private TextView dateLine;
    private TextView clock;
    private TextView clockSuffix;
    private TextView statusPill;
    private TextView nextEmoji;
    private TextView nextTitle;
    private TextView nextTime;
    private TextView countdown;
    private TextView nextMessage;
    private TextView percent;
    private ProgressBar progress;
    private TextView progressText;
    private LinearLayout timeline;

    private RoutineItem next;
    private String day;
    private int lastTimelineMinute = -1;
    private boolean timelineDirty = true;

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            refresh();
            handler.postDelayed(this, 1000L);
        }
    };

    /** Forces the timeline to be rebuilt on the next tick. */
    private void invalidateTimeline() {
        timelineDirty = true;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        bind();
        wireActions();
        Permissions.askNotificationPermission(this);
        if (Permissions.notificationsGranted(this)) {
            Permissions.showFirstRunHelp(this);
        }
        animateEntrance();
    }

    private void bind() {
        greeting = findViewById(R.id.greeting);
        dateLine = findViewById(R.id.date_line);
        clock = findViewById(R.id.clock);
        clockSuffix = findViewById(R.id.clock_suffix);
        statusPill = findViewById(R.id.status_pill);
        nextEmoji = findViewById(R.id.next_emoji);
        nextTitle = findViewById(R.id.next_title);
        nextTime = findViewById(R.id.next_time);
        countdown = findViewById(R.id.countdown);
        nextMessage = findViewById(R.id.next_message);
        percent = findViewById(R.id.percent);
        progress = findViewById(R.id.progress);
        progressText = findViewById(R.id.progress_text);
        timeline = findViewById(R.id.timeline);
    }

    private void animateEntrance() {
        Ui.animateIn(findViewById(R.id.hero), 40);
        Ui.animateIn(findViewById(R.id.next_card), 110);
    }

    private void wireActions() {
        findViewById(R.id.action_routine).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, RoutineActivity.class));
            }
        });
        findViewById(R.id.action_assistant).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, AssistantActivity.class));
            }
        });
        findViewById(R.id.action_settings).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, SettingsActivity.class));
            }
        });
        findViewById(R.id.btn_mark_done).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (next == null) {
                    return;
                }
                RoutineDb.get(MainActivity.this).markDone(day, next.id);
                AlarmScheduler.cancelSnooze(MainActivity.this, next.id);
                invalidateTimeline();
                Toast.makeText(MainActivity.this,
                        getString(R.string.alarm_marked_done, Prefs.get(MainActivity.this).userName()),
                        Toast.LENGTH_SHORT).show();
                refresh();
            }
        });
        findViewById(R.id.btn_snooze).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (next == null) {
                    return;
                }
                int minutes = Prefs.get(MainActivity.this).snoozeMinutes();
                AlarmScheduler.scheduleSnooze(MainActivity.this, next.id, minutes);
                Toast.makeText(MainActivity.this,
                        getString(R.string.alarm_snoozed_for, minutes),
                        Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        App.onDayChanged(this);
        // Keep the schedule healthy every time Ronny opens the app.
        AlarmScheduler.rescheduleAll(this);
        invalidateTimeline();
        handler.removeCallbacks(tick);
        handler.post(tick);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(tick);
    }

    private void refresh() {
        Prefs prefs = Prefs.get(this);
        RoutineDb db = RoutineDb.get(this);
        day = TimeUtils.dayKey();
        boolean is24 = DateFormat.is24HourFormat(this);

        List<RoutineItem> items = db.all();
        int now = TimeUtils.nowMinutes();
        int done = db.doneCount(day);

        renderHeader(prefs, is24, items, done);
        next = findNext(items, db, now);
        renderNext(prefs, next, is24, now);
        renderProgress(items, done);

        // The timeline only changes when the clock ticks over a minute or the
        // underlying data changed, so rebuilding it every second would just
        // waste battery.
        if (timelineDirty || now != lastTimelineMinute) {
            lastTimelineMinute = now;
            timelineDirty = false;
            renderTimeline(items, db, now, is24);
        }
    }

    private void renderHeader(Prefs prefs, boolean is24, List<RoutineItem> items, int done) {
        String name = prefs.userName();
        int kind = TimeUtils.greetingKind();
        int res = R.string.greet_morning;
        if (kind == 1) {
            res = R.string.greet_afternoon;
        } else if (kind == 2) {
            res = R.string.greet_evening;
        } else if (kind == 3) {
            res = R.string.greet_night;
        }
        greeting.setText(getString(res, name));
        dateLine.setText(TimeUtils.longDate());

        java.util.Calendar c = java.util.Calendar.getInstance();
        String time;
        if (is24) {
            time = TimeUtils.two(c.get(java.util.Calendar.HOUR_OF_DAY)) + ":"
                    + TimeUtils.two(c.get(java.util.Calendar.MINUTE));
            clockSuffix.setText("");
        } else {
            int h = c.get(java.util.Calendar.HOUR_OF_DAY);
            String suffix = h < 12 ? "AM" : "PM";
            int h12 = h % 12;
            if (h12 == 0) {
                h12 = 12;
            }
            time = h12 + ":" + TimeUtils.two(c.get(java.util.Calendar.MINUTE));
            clockSuffix.setText(suffix);
        }
        clock.setText(time);

        String pill;
        if (!prefs.masterEnabled()) {
            pill = "Reminders paused";
        } else if (items.size() > 0 && done >= items.size()) {
            pill = "Day complete 🎉";
        } else if (!AlarmScheduler.canScheduleExact(this)) {
            pill = "Exact alarms off";
        } else {
            pill = "All set for today";
        }
        statusPill.setText(pill);
    }

    private RoutineItem findNext(List<RoutineItem> items, RoutineDb db, int now) {
        RoutineItem best = null;
        for (RoutineItem item : items) {
            if (!item.enabled || !item.repeatsToday()) {
                continue;
            }
            if (db.isDone(day, item.id)) {
                continue;
            }
            if (item.startMin >= now && (best == null || item.startMin < best.startMin)) {
                best = item;
            }
        }
        return best;
    }

    private void renderNext(final Prefs prefs, RoutineItem item, boolean is24, int now) {
        View buttonRow = findViewById(R.id.btn_mark_done).getParent() instanceof View
                ? (View) findViewById(R.id.btn_mark_done).getParent() : null;
        if (item == null) {
            nextEmoji.setText("✅");
            nextTitle.setText(R.string.dash_no_more);
            nextTime.setText(getString(R.string.dash_all_done, prefs.userName()));
            countdown.setText("--");
            nextMessage.setText(getString(R.string.dash_all_done, prefs.userName()));
            if (buttonRow != null) {
                buttonRow.setVisibility(View.GONE);
            }
            return;
        }
        if (buttonRow != null) {
            buttonRow.setVisibility(View.VISIBLE);
        }
        nextEmoji.setText(item.emoji);
        nextTitle.setText(item.title);
        nextTime.setText(item.timeRangeLabel(is24));

        long millis = item.nextTrigger(System.currentTimeMillis()).getTimeInMillis()
                - System.currentTimeMillis();
        countdown.setText(TimeUtils.countdown(millis));
        nextMessage.setText(item.message);
    }

    private void renderProgress(List<RoutineItem> items, int done) {
        int total = items.size();
        int value = total == 0 ? 0 : (int) Math.round(done * 100.0 / total);
        percent.setText(value + "%");
        progress.setProgress(value);
        progressText.setText(getString(R.string.dash_completed_of, done, total));
    }

    private void renderTimeline(List<RoutineItem> items, RoutineDb db, int now, boolean is24) {
        timeline.removeAllViews();
        if (items.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText(R.string.routine_empty);
            empty.setTextColor(getResources().getColor(R.color.text_muted));
            empty.setTextSize(14f);
            empty.setGravity(Gravity.CENTER);
            empty.setPadding(0, Ui.dp(this, 24), 0, Ui.dp(this, 24));
            timeline.addView(empty);
            return;
        }
        for (final RoutineItem item : items) {
            boolean done = db.isDone(day, item.id);
            boolean fired = db.isFired(day, item.id);
            int state = item.stateRelativeTo(now, done, fired);

            LinearLayout row = new LinearLayout(this);
            row.setOrientation(LinearLayout.HORIZONTAL);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(Ui.dp(this, 10), Ui.dp(this, 10), Ui.dp(this, 10), Ui.dp(this, 10));
            row.setMinimumHeight(Ui.dp(this, 56));

            TextView emoji = new TextView(this);
            emoji.setLayoutParams(new LinearLayout.LayoutParams(Ui.dp(this, 38), Ui.dp(this, 38)));
            emoji.setGravity(Gravity.CENTER);
            emoji.setTextSize(18f);
            emoji.setText(item.emoji);
            emoji.setBackgroundResource(state == 3 ? R.drawable.ring_done : R.drawable.ring_pending);
            emoji.setAlpha(item.enabled ? 1f : 0.45f);
            row.addView(emoji);

            LinearLayout texts = new LinearLayout(this);
            texts.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            tlp.leftMargin = Ui.dp(this, 12);
            texts.setLayoutParams(tlp);

            LinearLayout titleRow = new LinearLayout(this);
            titleRow.setOrientation(LinearLayout.HORIZONTAL);
            titleRow.setGravity(Gravity.CENTER_VERTICAL);

            TextView title = new TextView(this);
            title.setText(item.title);
            title.setTextSize(15f);
            title.setTypeface(null, android.graphics.Typeface.BOLD);
            int titleColor = R.color.text_primary;
            if (state == 3) {
                titleColor = R.color.success;
            } else if (!item.enabled) {
                titleColor = R.color.text_muted;
            }
            title.setTextColor(getResources().getColor(titleColor));
            titleRow.addView(title);

            String stateText = "";
            int stateColor = R.color.text_muted;
            if (state == 0) {
                stateText = getString(R.string.dash_now);
                stateColor = R.color.accent;
            } else if (state == 3) {
                stateText = getString(R.string.dash_done);
                stateColor = R.color.success;
            } else if (state == 2) {
                stateText = getString(R.string.dash_missed);
                stateColor = R.color.accent_warm;
            }
            if (stateText.length() > 0) {
                TextView badge = new TextView(this);
                badge.setText(stateText);
                badge.setTextSize(9f);
                badge.setTypeface(null, android.graphics.Typeface.BOLD);
                badge.setLetterSpacing(0.08f);
                badge.setTextColor(getResources().getColor(stateColor));
                badge.setBackgroundResource(R.drawable.shape_chip);
                badge.setPadding(Ui.dp(this, 6), Ui.dp(this, 2), Ui.dp(this, 6), Ui.dp(this, 2));
                LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT);
                blp.leftMargin = Ui.dp(this, 8);
                badge.setLayoutParams(blp);
                titleRow.addView(badge);
            }
            texts.addView(titleRow);

            TextView time = new TextView(this);
            time.setText(item.timeRangeLabel(is24)
                    + (item.repeatsToday() ? "" : "  •  " + TimeUtils.daysLabel(item.days)));
            time.setTextSize(12f);
            time.setTextColor(getResources().getColor(R.color.text_muted));
            texts.addView(time);
            row.addView(texts);

            if (state == 3) {
                ImageView tick = new ImageView(this);
                tick.setImageResource(R.drawable.ic_check);
                tick.setLayoutParams(new LinearLayout.LayoutParams(
                        Ui.dp(this, 20), Ui.dp(this, 20)));
                row.addView(tick);
            } else {
                TextView ring = new TextView(this);
                ring.setText("▶");
                ring.setTextSize(16f);
                ring.setTextColor(getResources().getColor(R.color.accent));
                LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(
                        Ui.dp(this, 30), Ui.dp(this, 30));
                rlp.leftMargin = Ui.dp(this, 6);
                ring.setLayoutParams(rlp);
                ring.setGravity(Gravity.CENTER);
                ring.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        preview(item);
                    }
                });
                row.addView(ring);
            }

            timeline.addView(row);
        }
    }

    /** Plays the tone and speaks the message, exactly as the real reminder will. */
    private void preview(RoutineItem item) {
        Prefs prefs = Prefs.get(this);
        SoundPlayer.play(this, item.sound, prefs.volumeFraction());
        Speech.get(this).speak(item.spokenText(prefs.userName()),
                prefs.volumeFraction(), null);
        Toast.makeText(this, item.title, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(tick);
        super.onDestroy();
    }
}
