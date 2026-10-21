package com.ronny.assistant.ui;

import android.app.Activity;
import android.os.Bundle;
import android.text.format.DateFormat;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.TextView;

import com.ronny.assistant.R;
import com.ronny.assistant.ai.MotivationClient;
import com.ronny.assistant.ai.MotivationEngine;
import com.ronny.assistant.alarm.Speech;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.Ui;

import java.util.ArrayList;
import java.util.List;

/**
 * Optional motivational chat. Works completely offline; when Ronny enables the
 * online assistant in Settings the reply comes from his own backend instead.
 */
public class AssistantActivity extends Activity {

    private final List<Bubble> messages = new ArrayList<Bubble>();
    private BubbleAdapter adapter;
    private EditText input;
    private ListView chat;
    private TextView mode;

    private static class Bubble {
        String text;
        boolean user;
        boolean fromServer;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_assistant);

        chat = findViewById(R.id.chat);
        input = findViewById(R.id.input);
        mode = findViewById(R.id.mode);

        adapter = new BubbleAdapter();
        chat.setAdapter(adapter);

        updateMode();
        addBubble(getString(R.string.assistant_welcome), false, false);

        buildChips();

        findViewById(R.id.btn_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        findViewById(R.id.btn_send).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                send();
            }
        });
        input.setOnEditorActionListener(new TextView.OnEditorActionListener() {
            @Override
            public boolean onEditorAction(TextView v, int actionId, KeyEvent event) {
                send();
                return true;
            }
        });
    }

    private void updateMode() {
        Prefs prefs = Prefs.get(this);
        if (prefs.aiEnabled() && prefs.aiEndpoint().trim().length() > 0) {
            mode.setText("Online assistant enabled");
        } else {
            mode.setText(getString(R.string.assistant_offline_note));
        }
    }

    private void buildChips() {
        LinearLayout chips = findViewById(R.id.chips);
        chips.removeAllViews();
        List<String> quick = MotivationEngine.quickReplies(this);
        for (int i = 0; i < quick.size(); i++) {
            final String text = quick.get(i);
            TextView chip = Ui.chip(this, text, 0);
            LinearLayout.LayoutParams lp = (LinearLayout.LayoutParams) chip.getLayoutParams();
            lp.width = LinearLayout.LayoutParams.WRAP_CONTENT;
            lp.height = Ui.dp(this, 36);
            lp.rightMargin = Ui.dp(this, 8);
            chip.setLayoutParams(lp);
            chip.setPadding(Ui.dp(this, 14), 0, Ui.dp(this, 14), 0);
            chip.setGravity(Gravity.CENTER_VERTICAL);
            chip.setTextSize(12f);
            chip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    input.setText(text);
                    send();
                }
            });
            chips.addView(chip);
        }
    }

    private void send() {
        final String question = input.getText().toString().trim();
        if (question.length() == 0) {
            return;
        }
        input.setText("");
        addBubble(question, true, false);
        addBubble(getString(R.string.assistant_thinking), false, false);
        final int placeholder = messages.size() - 1;

        MotivationClient.ask(this, question, new MotivationClient.Callback() {
            @Override
            public void onResult(String message, boolean fromServer) {
                if (placeholder < messages.size()) {
                    messages.remove(placeholder);
                }
                addBubble(message, false, fromServer);
            }

            @Override
            public void onError() {
                if (placeholder < messages.size()) {
                    messages.remove(placeholder);
                }
                addBubble(getString(R.string.assistant_error) + " "
                        + MotivationEngine.reply(AssistantActivity.this, question), false, false);
            }
        });
    }

    private void addBubble(String text, boolean user, boolean fromServer) {
        Bubble b = new Bubble();
        b.text = text;
        b.user = user;
        b.fromServer = fromServer;
        messages.add(b);
        adapter.notifyDataSetChanged();
        if (!user && Prefs.get(this).voiceEnabled()) {
            Speech.get(this).speak(text, Prefs.get(this).volumeFraction(), null);
        }
    }

    private class BubbleAdapter extends BaseAdapter {

        @Override
        public int getCount() {
            return messages.size();
        }

        @Override
        public Object getItem(int position) {
            return messages.get(position);
        }

        @Override
        public long getItemId(int position) {
            return position;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View v = convertView;
            if (v == null) {
                v = getLayoutInflater().inflate(R.layout.item_chat, parent, false);
            }
            Bubble b = messages.get(position);
            TextView bubble = v.findViewById(R.id.bubble);
            TextView meta = v.findViewById(R.id.meta);

            bubble.setText(b.text);
            if (b.user) {
                bubble.setBackgroundResource(R.drawable.shape_card_hero);
                bubble.setTextColor(getResources().getColor(R.color.white));
                bubble.setLayoutParams(alignEnd(bubble));
                meta.setLayoutParams(alignEnd(meta));
                meta.setText("Ronny");
            } else {
                bubble.setBackgroundResource(R.drawable.shape_card_small);
                bubble.setTextColor(getResources().getColor(R.color.text_primary));
                bubble.setLayoutParams(alignStart(bubble));
                meta.setLayoutParams(alignStart(meta));
                meta.setText(b.fromServer ? "Online assistant" : "Offline assistant");
            }
            return v;
        }
    }

    private LinearLayout.LayoutParams alignEnd(View view) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.END;
        return lp;
    }

    private LinearLayout.LayoutParams alignStart(View view) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.gravity = Gravity.START;
        return lp;
    }

    /** Shows a compact summary at the top of the conversation when opened. */
    static String summary(Activity activity) {
        RoutineDb db = RoutineDb.get(activity);
        List<RoutineItem> items = db.all();
        RoutineItem next = MotivationEngine.nextUp(items);
        if (next == null) {
            return "All done for today";
        }
        return next.title + " at " + com.ronny.assistant.util.TimeUtils.format(next.startMin,
                DateFormat.is24HourFormat(activity));
    }
}
