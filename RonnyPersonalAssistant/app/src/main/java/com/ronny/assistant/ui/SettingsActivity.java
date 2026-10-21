package com.ronny.assistant.ui;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import com.ronny.assistant.R;
import com.ronny.assistant.alarm.AlarmScheduler;
import com.ronny.assistant.alarm.SoundPlayer;
import com.ronny.assistant.alarm.Speech;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.util.Ui;

/** Every setting Ronny can change, built from code so it stays consistent. */
public class SettingsActivity extends Activity {

    private LinearLayout container;
    private Prefs prefs;

    private static final String[] BEHAVIOURS = {
            "Sound + voice", "Sound only", "Voice only", "Silent notification only"
    };
    private static final String[] LANGUAGES = {"hi-IN", "en-IN", "en-US"};
    private static final String[] LANGUAGE_LABELS = {
            "Hindi (India) - हिन्दी", "English (India)", "English (US)"
    };
    private static final int[] SNOOZE_OPTIONS = {5, 10, 15, 20, 30};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);
        container = findViewById(R.id.container);
        prefs = Prefs.get(this);

        findViewById(R.id.btn_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        build();
    }

    private void build() {
        container.removeAllViews();

        // ------------------------------------------------------ reminders
        LinearLayout reminders = Ui.section(this, container, getString(R.string.settings_group_reminders));

        Ui.addSwitchRow(this, reminders, R.drawable.ic_bell,
                getString(R.string.settings_master), "", prefs.masterEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        prefs.setMasterEnabled(isChecked);
                        if (isChecked) {
                            AlarmScheduler.rescheduleAll(SettingsActivity.this);
                        } else {
                            AlarmScheduler.cancelAll(SettingsActivity.this);
                            Toast.makeText(SettingsActivity.this, R.string.settings_master_off,
                                    Toast.LENGTH_SHORT).show();
                        }
                    }
                });
        Ui.divider(this, reminders);

        Ui.addSwitchRow(this, reminders, R.drawable.ic_mic,
                getString(R.string.settings_voice), getString(R.string.settings_voice_sub),
                prefs.voiceEnabled(), new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        prefs.setVoiceEnabled(isChecked);
                    }
                });
        Ui.divider(this, reminders);

        Ui.addValueRow(this, reminders, R.drawable.ic_volume,
                getString(R.string.settings_sound), getString(R.string.settings_sound_sub),
                SoundPlayer.label(this, prefs.soundKey()),
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        pickSound();
                    }
                });
        Ui.divider(this, reminders);

        Ui.addValueRow(this, reminders, R.drawable.ic_alarm,
                getString(R.string.settings_snooze), "",
                prefs.snoozeMinutes() + " min", new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        pickSnooze();
                    }
                });
        Ui.divider(this, reminders);

        Ui.addValueRow(this, reminders, R.drawable.ic_sliders,
                getString(R.string.settings_behaviour), getString(R.string.settings_behaviour_sub),
                BEHAVIOURS[prefs.behaviour()], new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        pickBehaviour();
                    }
                });
        Ui.divider(this, reminders);

        addSlider(reminders, R.drawable.ic_volume, getString(R.string.settings_volume),
                getString(R.string.settings_volume_sub), prefs.volumePercent(),
                new SliderListener() {
                    @Override
                    public void onValue(int value) {
                        prefs.setVolumePercent(value);
                    }
                });

        // ---------------------------------------------------------- voice
        LinearLayout voice = Ui.section(this, container, "Voice");

        Ui.addValueRow(this, voice, R.drawable.ic_mic, getString(R.string.settings_language),
                "", languageLabel(prefs.ttsLanguage()), new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        pickLanguage();
                    }
                });
        Ui.divider(this, voice);

        addSlider(voice, R.drawable.ic_mic, getString(R.string.settings_speech_rate), "",
                Math.round(prefs.speechRate() * 100f), new SliderListener() {
                    @Override
                    public void onValue(int value) {
                        prefs.setSpeechRate(value / 100f);
                        Speech.get(SettingsActivity.this).applySettings();
                    }
                });
        Ui.divider(this, voice);

        addSlider(voice, R.drawable.ic_mic, getString(R.string.settings_speech_pitch), "",
                Math.round(prefs.speechPitch() * 100f), new SliderListener() {
                    @Override
                    public void onValue(int value) {
                        prefs.setSpeechPitch(value / 100f);
                        Speech.get(SettingsActivity.this).applySettings();
                    }
                });
        Ui.divider(this, voice);

        Ui.addRow(this, voice, R.drawable.ic_volume, getString(R.string.toast_tts_test),
                "Plays one Hindi sentence now", null, new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        Speech.get(SettingsActivity.this).speak(
                                "Hello Ronny! Main aapki Hindi voice test kar raha hoon. "
                                        + "Sab kuch theek chal raha hai.",
                                prefs.volumeFraction(), null);
                        Toast.makeText(SettingsActivity.this, R.string.toast_tts_test,
                                Toast.LENGTH_SHORT).show();
                    }
                });
        Ui.divider(this, voice);

        Ui.addRow(this, voice, R.drawable.ic_refresh, getString(R.string.rel_tts),
                getString(R.string.rel_tts_desc), null, new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        Permissions.safeStart(SettingsActivity.this,
                                Speech.ttsSettingsIntent());
                    }
                });

        // ------------------------------------------------------------- ai
        LinearLayout ai = Ui.section(this, container, getString(R.string.settings_group_ai));
        Ui.addSwitchRow(this, ai, R.drawable.ic_sparkle, getString(R.string.settings_ai_enable),
                getString(R.string.settings_ai_sub), prefs.aiEnabled(),
                new CompoundButton.OnCheckedChangeListener() {
                    @Override
                    public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                        prefs.setAiEnabled(isChecked);
                        if (isChecked && prefs.aiEndpoint().trim().length() == 0) {
                            askEndpoint();
                        }
                    }
                });
        Ui.divider(this, ai);
        Ui.addValueRow(this, ai, R.drawable.ic_send, getString(R.string.settings_ai_endpoint),
                "", prefs.aiEndpoint().trim().length() == 0 ? "Not set" : prefs.aiEndpoint(),
                new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        askEndpoint();
                    }
                });

        TextView note = new TextView(this);
        note.setText(R.string.settings_ai_note);
        note.setTextColor(getResources().getColor(R.color.text_muted));
        note.setTextSize(12f);
        note.setLineSpacing(Ui.dp(this, 2), 1f);
        LinearLayout.LayoutParams nlp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        nlp.topMargin = Ui.dp(this, 10);
        note.setLayoutParams(nlp);
        ai.addView(note);

        // ---------------------------------------------------- reliability
        LinearLayout rel = Ui.section(this, container, getString(R.string.settings_group_reliability));
        Ui.addRow(this, rel, R.drawable.ic_shield, getString(R.string.rel_title),
                getString(R.string.settings_reliability_sub), null, new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        startActivity(new Intent(SettingsActivity.this, ReliabilityActivity.class));
                    }
                });

        // ----------------------------------------------------------- data
        LinearLayout data = Ui.section(this, container, getString(R.string.settings_group_data));
        Ui.addRow(this, data, R.drawable.ic_refresh, getString(R.string.action_reset),
                getString(R.string.settings_reset_sub), null, new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        confirmReset();
                    }
                });
    }

    private interface SliderListener {
        void onValue(int value);
    }

    private void addSlider(LinearLayout parent, int icon, String title, String subtitle,
                           int value, final SliderListener listener) {
        LinearLayout wrap = new LinearLayout(this);
        wrap.setOrientation(LinearLayout.VERTICAL);
        int pad = Ui.dp(this, 14);
        wrap.setPadding(pad, pad, pad, pad);

        SeekBar bar = new SeekBar(this);
        final TextView readout = new TextView(this);
        readout.setText(value + "%");
        readout.setTextColor(getResources().getColor(R.color.accent));
        readout.setTextSize(13f);
        readout.setTypeface(null, android.graphics.Typeface.BOLD);
        readout.setGravity(Gravity.CENTER_VERTICAL);

        Ui.addRow(this, wrap, icon, title, subtitle, readout, null);

        bar.setMax(100);
        bar.setProgress(value);
        bar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                readout.setText(progress + "%");
                if (fromUser) {
                    listener.onValue(progress);
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                listener.onValue(seekBar.getProgress());
            }
        });
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        blp.topMargin = Ui.dp(this, 2);
        wrap.addView(bar, blp);
        parent.addView(wrap);
    }

    // ------------------------------------------------------------ pickers

    private void pickSound() {
        final String[] keys = SoundPlayer.KEYS;
        final String[] labels = SoundPlayer.labels(this);
        int current = 0;
        for (int i = 0; i < keys.length; i++) {
            if (keys[i].equals(prefs.soundKey())) {
                current = i;
            }
        }
        new AlertDialog.Builder(this)
                .setTitle(R.string.settings_sound)
                .setSingleChoiceItems(labels, current, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        prefs.setSoundKey(keys[which]);
                        SoundPlayer.play(SettingsActivity.this, keys[which],
                                prefs.volumeFraction());
                    }
                })
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        SoundPlayer.stop();
                        build();
                    }
                })
                .setNegativeButton(R.string.cancel, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        SoundPlayer.stop();
                    }
                })
                .show();
    }

    private void pickSnooze() {
        String[] labels = new String[SNOOZE_OPTIONS.length];
        int current = 0;
        for (int i = 0; i < SNOOZE_OPTIONS.length; i++) {
            labels[i] = SNOOZE_OPTIONS[i] + " minutes";
            if (SNOOZE_OPTIONS[i] == prefs.snoozeMinutes()) {
                current = i;
            }
        }
        new AlertDialog.Builder(this)
                .setTitle(R.string.settings_snooze)
                .setSingleChoiceItems(labels, current, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        prefs.setSnoozeMinutes(SNOOZE_OPTIONS[which]);
                    }
                })
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        build();
                    }
                })
                .show();
    }

    private void pickBehaviour() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.settings_behaviour)
                .setSingleChoiceItems(BEHAVIOURS, prefs.behaviour(),
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                prefs.setBehaviour(which);
                            }
                        })
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        build();
                    }
                })
                .show();
    }

    private void pickLanguage() {
        int current = 0;
        for (int i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i].equals(prefs.ttsLanguage())) {
                current = i;
            }
        }
        new AlertDialog.Builder(this)
                .setTitle(R.string.settings_language)
                .setSingleChoiceItems(LANGUAGE_LABELS, current,
                        new DialogInterface.OnClickListener() {
                            @Override
                            public void onClick(DialogInterface dialog, int which) {
                                prefs.setTtsLanguage(LANGUAGES[which]);
                                Speech.get(SettingsActivity.this).applySettings();
                            }
                        })
                .setPositiveButton(R.string.ok, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        build();
                    }
                })
                .show();
    }

    private String languageLabel(String tag) {
        for (int i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i].equals(tag)) {
                return LANGUAGE_LABELS[i];
            }
        }
        return tag;
    }

    private void askEndpoint() {
        final EditText input = new EditText(this);
        input.setText(prefs.aiEndpoint());
        input.setHint(R.string.settings_ai_endpoint_hint);
        input.setSingleLine(true);
        int pad = Ui.dp(this, 18);
        LinearLayout wrap = new LinearLayout(this);
        wrap.setPadding(pad, pad, pad, 0);
        wrap.addView(input, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT));

        new AlertDialog.Builder(this)
                .setTitle(R.string.settings_ai_endpoint)
                .setMessage(R.string.settings_ai_note)
                .setView(wrap)
                .setPositiveButton(R.string.action_save, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        prefs.setAiEndpoint(input.getText().toString().trim());
                        build();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void confirmReset() {
        new AlertDialog.Builder(this)
                .setTitle(R.string.reset_confirm_title)
                .setMessage(R.string.reset_confirm_body)
                .setPositiveButton(R.string.action_reset, new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface dialog, int which) {
                        RoutineDb.get(SettingsActivity.this).resetToDefault();
                        AlarmScheduler.rescheduleAll(SettingsActivity.this);
                        Toast.makeText(SettingsActivity.this, R.string.routine_saved,
                                Toast.LENGTH_SHORT).show();
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
