package com.ronny.assistant.ui;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.TimePickerDialog;
import android.content.DialogInterface;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.Notifier;
import com.ronny.assistant.alarm.SoundPlayer;
import com.ronny.assistant.data.DefaultRoutine;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;
import com.ronny.assistant.util.Ui;

/** Add a new activity or edit an existing one. */
public class EditActivity extends Activity {

    public static final String EXTRA_ITEM_ID = "item_id";

    private long id = -1L;
    private RoutineItem item;

    private EditText name;
    private EditText message;
    private TextView startTime;
    private TextView endTime;
    private Spinner soundSpinner;
    private Switch enabled;
    private Switch voice;

    private int startMin = 9 * 60;
    private int endMin = RoutineItem.NO_END;
    private int days = TimeUtils.allDays();
    private String emoji = "⏰";
    private String[] soundKeys;

    private boolean is24;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_edit);
        is24 = DateFormat.is24HourFormat(this);

        id = getIntent().getLongExtra(EXTRA_ITEM_ID, -1L);

        name = findViewById(R.id.name);
        message = findViewById(R.id.message);
        startTime = findViewById(R.id.start_time);
        endTime = findViewById(R.id.end_time);
        soundSpinner = findViewById(R.id.sound);
        enabled = findViewById(R.id.enabled);
        voice = findViewById(R.id.voice);

        soundKeys = SoundPlayer.KEYS;
        ArrayAdapter<String> soundAdapter = new ArrayAdapter<String>(this,
                R.layout.item_spinner, SoundPlayer.labels(this));
        soundAdapter.setDropDownViewResource(R.layout.item_spinner);
        soundSpinner.setAdapter(soundAdapter);

        if (id > 0) {
            item = RoutineDb.get(this).get(id);
        }
        if (item == null) {
            item = new RoutineItem();
            item.sound = Prefs.get(this).soundKey();
            ((TextView) findViewById(R.id.title)).setText(R.string.edit_title_new);
        } else {
            ((TextView) findViewById(R.id.title)).setText(R.string.edit_title_existing);
            findViewById(R.id.btn_delete).setVisibility(View.VISIBLE);
        }

        name.setText(item.title);
        name.setSelection(name.getText().length());
        message.setText(item.message);
        startMin = item.startMin;
        endMin = item.endMin;
        days = item.days;
        emoji = item.emoji;
        enabled.setChecked(item.enabled);
        voice.setChecked(item.voice);

        int soundIndex = 0;
        for (int i = 0; i < soundKeys.length; i++) {
            if (soundKeys[i].equals(item.sound)) {
                soundIndex = i;
            }
        }
        soundSpinner.setSelection(soundIndex);

        buildDayToggles();
        buildIconPicker();
        updateTimes();

        startTime.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pickTime(true);
            }
        });
        endTime.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                pickTime(false);
            }
        });
        findViewById(R.id.btn_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        findViewById(R.id.btn_save).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                save();
            }
        });
        findViewById(R.id.btn_delete).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                confirmDelete();
            }
        });
        soundSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long itemId) {
                SoundPlayer.play(EditActivity.this, soundKeys[position],
                        Prefs.get(EditActivity.this).volumeFraction());
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {
            }
        });
    }

    private void buildDayToggles() {
        final LinearLayout host = findViewById(R.id.days);
        host.removeAllViews();
        String[] labels = TimeUtils.dayLabels();
        String[] names = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
        for (int i = 0; i < labels.length; i++) {
            final int bit = 1 << i;
            final TextView chip = Ui.chip(this, labels[i], 40);
            applyChipState(chip, (days & bit) != 0);
            chip.setContentDescription(names[i]);
            chip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    if ((days & bit) != 0) {
                        days &= ~bit;
                    } else {
                        days |= bit;
                    }
                    applyChipState(chip, (days & bit) != 0);
                }
            });
            host.addView(chip);
        }
        View spacer = new View(this);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, 1f));
        host.addView(spacer);

        final TextView all = Ui.chip(this, "All", 56);
        all.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                days = TimeUtils.allDays();
                buildDayToggles();
            }
        });
        host.addView(all);
    }

    private void applyChipState(TextView chip, boolean on) {
        if (on) {
            chip.setBackgroundResource(R.drawable.shape_circle_brand);
            chip.setTextColor(getResources().getColor(R.color.white));
        } else {
            chip.setBackgroundResource(R.drawable.shape_chip);
            chip.setTextColor(getResources().getColor(R.color.text_secondary));
        }
    }

    private void buildIconPicker() {
        LinearLayout host = findViewById(R.id.icons);
        host.removeAllViews();
        String[] choices = DefaultRoutine.ICON_CHOICES;
        for (int i = 0; i < choices.length; i++) {
            final String value = choices[i];
            final TextView chip = Ui.chip(this, value, 40);
            if (value.equals(emoji)) {
                chip.setBackgroundResource(R.drawable.shape_circle_brand);
            }
            chip.setTextSize(18f);
            chip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    emoji = value;
                    buildIconPicker();
                }
            });
            host.addView(chip);
        }
    }

    private void pickTime(final boolean isStart) {
        int current = isStart ? startMin : (endMin < 0 ? startMin : endMin);
        new TimePickerDialog(this, new TimePickerDialog.OnTimeSetListener() {
            @Override
            public void onTimeSet(android.widget.TimePicker view, int hourOfDay, int minute) {
                int value = hourOfDay * 60 + minute;
                if (isStart) {
                    startMin = value;
                    if (endMin >= 0 && endMin <= startMin) {
                        endMin = RoutineItem.NO_END;
                    }
                } else {
                    endMin = value <= startMin ? RoutineItem.NO_END : value;
                }
                updateTimes();
            }
        }, current / 60, current % 60, is24).show();
    }

    private void updateTimes() {
        startTime.setText(TimeUtils.format(startMin, is24));
        if (endMin < 0) {
            endTime.setText(R.string.edit_end_time_none);
            endTime.setTextColor(getResources().getColor(R.color.text_muted));
        } else {
            endTime.setText(TimeUtils.format(endMin, is24));
            endTime.setTextColor(getResources().getColor(R.color.text_primary));
        }
    }

    private void save() {
        String title = name.getText().toString().trim();
        if (title.length() == 0) {
            name.setError(getString(R.string.edit_name));
            return;
        }
        if (days == 0) {
            Toast.makeText(this, "Choose at least one day", Toast.LENGTH_SHORT).show();
            return;
        }
        item.title = title;
        item.message = message.getText().toString().trim();
        item.startMin = startMin;
        item.endMin = endMin;
        item.days = days;
        item.emoji = emoji;
        item.enabled = enabled.isChecked();
        item.voice = voice.isChecked();
        item.sound = soundKeys[soundSpinner.getSelectedItemPosition()];

        long saved = RoutineDb.get(this).save(item);
        item.id = saved;

        if (item.enabled) {
            AlarmScheduler.scheduleItem(this, item);
        } else {
            AlarmScheduler.cancelItem(this, saved);
            Notifier.cancel(this, saved);
        }
        Toast.makeText(this, R.string.routine_saved, Toast.LENGTH_SHORT).show();
        setResult(RESULT_OK);
        finish();
    }

    private void confirmDelete() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.delete_confirm_title)
                .setMessage(getString(R.string.delete_confirm_body, item.title))
                .setPositiveButton(R.string.action_delete, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        RoutineDb.get(EditActivity.this).delete(id);
                        AlarmScheduler.cancelItem(EditActivity.this, id);
                        AlarmScheduler.cancelSnooze(EditActivity.this, id);
                        Notifier.cancel(EditActivity.this, id);
                        setResult(RESULT_OK);
                        finish();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    @Override
    protected void onPause() {
        super.onPause();
        SoundPlayer.stop();
    }
}
