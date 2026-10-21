package com.ronny.assistant.alarm;

import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import com.ronny.assistant.data.Prefs;

import java.util.ArrayList;
import java.util.Locale;

/**
 * Thin wrapper around Android's TextToSpeech engine, using platform APIs only.
 *
 * <p>The preferred language is Hindi (India). If the Hindi voice data is not
 * installed the engine reports it and callers can offer to open the system
 * Text-to-Speech settings. Nothing here needs the internet.</p>
 */
public class Speech implements TextToSpeech.OnInitListener {

    private static final String UTTERANCE = "ronny-utterance";

    private static Speech instance;

    private final Context appContext;
    private TextToSpeech tts;
    private boolean ready;
    private boolean languageMissing;
    private Runnable completion;
    private final ArrayList<Runnable> pending = new ArrayList<Runnable>();

    public static synchronized Speech get(Context context) {
        if (instance == null) {
            instance = new Speech(context.getApplicationContext());
        }
        return instance;
    }

    private Speech(Context context) {
        appContext = context;
        try {
            tts = new TextToSpeech(context, this);
        } catch (Throwable t) {
            tts = null;
        }
    }

    @Override
    public void onInit(int status) {
        ready = status == TextToSpeech.SUCCESS && tts != null;
        if (!ready) {
            pending.clear();
            return;
        }
        try {
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override
                public void onStart(String utteranceId) {
                }

                @Override
                public void onDone(String utteranceId) {
                    fireDone();
                }

                @Override
                @SuppressWarnings("deprecation")
                public void onError(String utteranceId) {
                    fireDone();
                }
            });
        } catch (Throwable ignored) {
        }
        applySettings();
        ArrayList<Runnable> queue;
        synchronized (this) {
            queue = new ArrayList<Runnable>(pending);
            pending.clear();
        }
        for (Runnable r : queue) {
            r.run();
        }
    }

    private synchronized void fireDone() {
        Runnable r = completion;
        completion = null;
        if (r != null) {
            r.run();
        }
    }

    /** Re-apply rate, pitch and language (call after settings change). */
    public void applySettings() {
        if (tts == null) {
            return;
        }
        try {
            Prefs prefs = Prefs.get(appContext);
            tts.setSpeechRate(prefs.speechRate());
            tts.setPitch(prefs.speechPitch());
            selectLanguage(prefs.ttsLocale());
        } catch (Throwable ignored) {
        }
    }

    public int selectLanguage(Locale locale) {
        if (tts == null || locale == null) {
            return TextToSpeech.ERROR;
        }
        try {
            int result = tts.setLanguage(locale);
            languageMissing = result == TextToSpeech.LANG_MISSING_DATA
                    || result == TextToSpeech.LANG_NOT_SUPPORTED;
            return result;
        } catch (Throwable t) {
            return TextToSpeech.ERROR;
        }
    }

    /** True when the chosen language (normally hi-IN) has voice data on this phone. */
    public boolean isLanguageAvailable() {
        return !languageMissing;
    }

    public boolean isReady() {
        return ready;
    }

    /**
     * Speaks {@code text} on the alarm stream. If the engine has not finished
     * initialising yet the request is queued and played as soon as it is ready.
     */
    public void speak(String text, final float volume, final Runnable onDone) {
        if (tts == null) {
            if (onDone != null) {
                onDone.run();
            }
            return;
        }
        final Runnable task = new Runnable() {
            @Override
            public void run() {
                speakNow(text, volume, onDone);
            }
        };
        if (ready) {
            task.run();
        } else {
            synchronized (this) {
                pending.add(task);
            }
        }
    }

    private void speakNow(String text, float volume, Runnable onDone) {
        try {
            completion = onDone;
            Prefs prefs = Prefs.get(appContext);
            selectLanguage(prefs.ttsLocale());
            Bundle params = new Bundle();
            params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM);
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, UTTERANCE);
        } catch (Throwable t) {
            fireDone();
        }
    }

    public void stop() {
        completion = null;
        synchronized (this) {
            pending.clear();
        }
        try {
            if (tts != null) {
                tts.stop();
            }
        } catch (Throwable ignored) {
        }
    }

    public void shutdown() {
        stop();
        try {
            if (tts != null) {
                tts.shutdown();
            }
        } catch (Throwable ignored) {
        }
        tts = null;
        ready = false;
        instance = null;
    }

    /** Opens the system Text-to-Speech settings so Hindi data can be installed. */
    public static Intent ttsSettingsIntent() {
        return new Intent("com.android.settings.TTS_SETTINGS");
    }
}
