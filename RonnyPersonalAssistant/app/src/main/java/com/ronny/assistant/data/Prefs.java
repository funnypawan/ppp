package com.ronny.assistant.data;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.Locale;

/** All app settings. Stored locally in SharedPreferences. */
public final class Prefs {

    public static final String NAME = "ronny_prefs";

    public static final String KEY_MASTER = "master_enabled";
    public static final String KEY_VOICE = "voice_enabled";
    public static final String KEY_SOUND = "sound_key";
    public static final String KEY_SNOOZE = "snooze_minutes";
    public static final String KEY_BEHAVIOUR = "behaviour";
    public static final String KEY_VOLUME = "volume_percent";
    public static final String KEY_RATE = "speech_rate";
    public static final String KEY_PITCH = "speech_pitch";
    public static final String KEY_LANG = "tts_language";
    public static final String KEY_AI_ENABLED = "ai_enabled";
    public static final String KEY_AI_ENDPOINT = "ai_endpoint";
    public static final String KEY_LAST_DAY = "last_day";
    public static final String KEY_USER_NAME = "user_name";
    public static final String KEY_ONBOARDED = "onboarded";

    /** Reminder behaviour. */
    public static final int BEHAVIOUR_SOUND_VOICE = 0;
    public static final int BEHAVIOUR_SOUND_ONLY = 1;
    public static final int BEHAVIOUR_VOICE_ONLY = 2;
    public static final int BEHAVIOUR_SILENT = 3;

    private final SharedPreferences sp;

    private Prefs(Context context) {
        sp = context.getApplicationContext().getSharedPreferences(NAME, Context.MODE_PRIVATE);
    }

    private static Prefs instance;

    public static synchronized Prefs get(Context context) {
        if (instance == null) {
            instance = new Prefs(context);
        }
        return instance;
    }

    public SharedPreferences raw() {
        return sp;
    }

    public boolean masterEnabled() {
        return sp.getBoolean(KEY_MASTER, true);
    }

    public void setMasterEnabled(boolean value) {
        sp.edit().putBoolean(KEY_MASTER, value).apply();
    }

    public boolean voiceEnabled() {
        return sp.getBoolean(KEY_VOICE, true);
    }

    public void setVoiceEnabled(boolean value) {
        sp.edit().putBoolean(KEY_VOICE, value).apply();
    }

    public String soundKey() {
        return sp.getString(KEY_SOUND, "chime");
    }

    public void setSoundKey(String value) {
        sp.edit().putString(KEY_SOUND, value).apply();
    }

    public int snoozeMinutes() {
        return sp.getInt(KEY_SNOOZE, 10);
    }

    public void setSnoozeMinutes(int value) {
        sp.edit().putInt(KEY_SNOOZE, value).apply();
    }

    public int behaviour() {
        return sp.getInt(KEY_BEHAVIOUR, BEHAVIOUR_SOUND_VOICE);
    }

    public void setBehaviour(int value) {
        sp.edit().putInt(KEY_BEHAVIOUR, value).apply();
    }

    /** 0 - 100, applied to both the reminder tone and the spoken message. */
    public int volumePercent() {
        return sp.getInt(KEY_VOLUME, 100);
    }

    public void setVolumePercent(int value) {
        sp.edit().putInt(KEY_VOLUME, value).apply();
    }

    public float volumeFraction() {
        return Math.max(0f, Math.min(1f, volumePercent() / 100f));
    }

    public float speechRate() {
        return sp.getFloat(KEY_RATE, 0.95f);
    }

    public void setSpeechRate(float value) {
        sp.edit().putFloat(KEY_RATE, value).apply();
    }

    public float speechPitch() {
        return sp.getFloat(KEY_PITCH, 1.0f);
    }

    public void setSpeechPitch(float value) {
        sp.edit().putFloat(KEY_PITCH, value).apply();
    }

    /** BCP-47 tag chosen by the user, e.g. "hi-IN" or "en-IN". */
    public String ttsLanguage() {
        return sp.getString(KEY_LANG, "hi-IN");
    }

    public void setTtsLanguage(String tag) {
        sp.edit().putString(KEY_LANG, tag).apply();
    }

    public Locale ttsLocale() {
        String[] parts = ttsLanguage().split("-");
        if (parts.length >= 2) {
            return new Locale(parts[0], parts[1]);
        }
        return new Locale(parts[0]);
    }

    public boolean aiEnabled() {
        return sp.getBoolean(KEY_AI_ENABLED, false);
    }

    public void setAiEnabled(boolean value) {
        sp.edit().putBoolean(KEY_AI_ENABLED, value).apply();
    }

    /**
     * Optional backend that proxies an LLM. The API key lives on that server,
     * never inside this APK. Empty means the assistant stays offline.
     */
    public String aiEndpoint() {
        return sp.getString(KEY_AI_ENDPOINT, "");
    }

    public void setAiEndpoint(String value) {
        sp.edit().putString(KEY_AI_ENDPOINT, value).apply();
    }

    public String userName() {
        return sp.getString(KEY_USER_NAME, "Ronny");
    }

    public void setUserName(String value) {
        sp.edit().putString(KEY_USER_NAME, value).apply();
    }

    public boolean onboarded() {
        return sp.getBoolean(KEY_ONBOARDED, false);
    }

    public void setOnboarded(boolean value) {
        sp.edit().putBoolean(KEY_ONBOARDED, value).apply();
    }

    /** Day key of the last housekeeping run; drives the daily rollover. */
    public String lastDay() {
        return sp.getString(KEY_LAST_DAY, "");
    }

    public void setLastDay(String value) {
        sp.edit().putString(KEY_LAST_DAY, value).apply();
    }
}
