package com.ronny.assistant.ai;

import android.os.Handler;
import android.os.Looper;

import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

/**
 * Optional online brain.
 *
 * <p>The app never contains an API key. If Ronny enables the online assistant
 * he points the app at his own small backend (see {@code backend/server.py}),
 * which keeps the secret key on the server and only ever returns short Hindi
 * motivation.</p>
 *
 * <p>Every failure falls back to {@link MotivationEngine}, so the assistant is
 * fully usable with the internet switched off.</p>
 */
public final class MotivationClient {

    public interface Callback {
        void onResult(String message, boolean fromServer);

        void onError();
    }

    private static final int TIMEOUT_MS = 12000;
    private static final Handler MAIN = new Handler(Looper.getMainLooper());

    private MotivationClient() {
    }

    /** Asks the configured backend; falls back to the local engine on any problem. */
    public static void ask(final android.content.Context context,
                           final String question,
                           final Callback callback) {
        final Prefs prefs = Prefs.get(context);
        final String endpoint = prefs.aiEndpoint();
        if (!prefs.aiEnabled() || endpoint == null || endpoint.trim().length() == 0) {
            MAIN.post(new Runnable() {
                @Override
                public void run() {
                    callback.onResult(MotivationEngine.reply(context, question), false);
                }
            });
            return;
        }

        new Thread(new Runnable() {
            @Override
            public void run() {
                String answer = null;
                HttpURLConnection conn = null;
                try {
                    JSONObject body = new JSONObject();
                    body.put("message", question);
                    body.put("name", prefs.userName());
                    body.put("language", prefs.ttsLanguage());
                    body.put("context", contextSummary(context));

                    conn = (HttpURLConnection) new URL(endpoint.trim()).openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                    conn.setConnectTimeout(TIMEOUT_MS);
                    conn.setReadTimeout(TIMEOUT_MS);
                    conn.setDoOutput(true);

                    OutputStream os = conn.getOutputStream();
                    os.write(body.toString().getBytes("UTF-8"));
                    os.flush();
                    os.close();

                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 300) {
                        BufferedReader reader = new BufferedReader(
                                new InputStreamReader(conn.getInputStream(), "UTF-8"));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) {
                            sb.append(line);
                        }
                        reader.close();
                        JSONObject json = new JSONObject(sb.toString());
                        answer = json.optString("reply", json.optString("message", ""));
                    }
                } catch (Throwable t) {
                    answer = null;
                } finally {
                    if (conn != null) {
                        conn.disconnect();
                    }
                }

                final String finalAnswer = (answer == null || answer.trim().length() == 0) ? null : answer.trim();
                MAIN.post(new Runnable() {
                    @Override
                    public void run() {
                        if (finalAnswer != null) {
                            callback.onResult(finalAnswer, true);
                        } else {
                            callback.onError();
                        }
                    }
                });
            }
        }).start();
    }

    /** Read-only snapshot of the day, so the server can personalise without storing data. */
    private static JSONObject contextSummary(android.content.Context context) {
        JSONObject out = new JSONObject();
        try {
            RoutineDb db = RoutineDb.get(context);
            List<RoutineItem> items = db.all();
            int done = db.doneCount(com.ronny.assistant.util.TimeUtils.dayKey());
            out.put("total", items.size());
            out.put("done", done);
            JSONArray names = new JSONArray();
            for (RoutineItem item : items) {
                names.put(item.title + " " + com.ronny.assistant.util.TimeUtils.to24(item.startMin));
            }
            out.put("schedule", names);
        } catch (Throwable ignored) {
        }
        return out;
    }
}
