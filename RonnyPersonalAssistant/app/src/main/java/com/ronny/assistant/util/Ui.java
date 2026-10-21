package com.ronny.assistant.util;

import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.CompoundButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

import com.ronny.assistant.R;

/** Small view builders so the code-built screens share one clean look. */
public final class Ui {

    private Ui() {
    }

    public static int dp(Context context, float value) {
        return (int) (value * context.getResources().getDisplayMetrics().density + 0.5f);
    }

    /** A titled group of cards with a section label above it. */
    public static LinearLayout section(Context context, ViewGroup parent, String title) {
        TextView label = new TextView(context);
        label.setText(title);
        label.setTextColor(context.getResources().getColor(R.color.text_muted));
        label.setTextSize(12f);
        label.setTypeface(null, android.graphics.Typeface.BOLD);
        label.setLetterSpacing(0.09f);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.leftMargin = dp(context, 4);
        lp.topMargin = dp(context, 22);
        lp.bottomMargin = dp(context, 10);
        label.setLayoutParams(lp);
        parent.addView(label);

        LinearLayout card = new LinearLayout(context);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setBackgroundResource(R.drawable.shape_card);
        LinearLayout.LayoutParams clp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        card.setLayoutParams(clp);
        int pad = dp(context, 16);
        card.setPadding(pad, dp(context, 4), pad, dp(context, 4));
        parent.addView(card);
        return card;
    }

    public static void divider(Context context, ViewGroup parent) {
        View v = new View(context);
        v.setBackgroundColor(context.getResources().getColor(R.color.stroke));
        v.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, dp(context, 1)));
        parent.addView(v);
    }

    /** Row with a leading icon, a title, an optional subtitle and a trailing view. */
    public static View addRow(Context context, ViewGroup parent, int icon, String title,
                              String subtitle, View trailing,
                              View.OnClickListener click) {
        LinearLayout row = new LinearLayout(context);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setMinimumHeight(dp(context, 58));
        int pad = dp(context, 14);
        row.setPadding(pad, pad, pad, pad);

        if (icon != 0) {
            ImageView iv = new ImageView(context);
            iv.setImageResource(icon);
            iv.setLayoutParams(new LinearLayout.LayoutParams(dp(context, 22), dp(context, 22)));
            row.addView(iv);
        }

        LinearLayout texts = new LinearLayout(context);
        texts.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams tlp = new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
        tlp.leftMargin = dp(context, 14);
        texts.setLayoutParams(tlp);

        TextView t = new TextView(context);
        t.setText(title);
        t.setTextColor(context.getResources().getColor(R.color.text_primary));
        t.setTextSize(15f);
        texts.addView(t);

        if (subtitle != null && subtitle.length() > 0) {
            TextView s = new TextView(context);
            s.setText(subtitle);
            s.setTextColor(context.getResources().getColor(R.color.text_muted));
            s.setTextSize(12f);
            s.setLineSpacing(dp(context, 1), 1f);
            texts.addView(s);
        }
        row.addView(texts);

        if (trailing != null) {
            row.addView(trailing);
        }
        if (click != null) {
            row.setOnClickListener(click);
            int[] attrs = new int[]{android.R.attr.selectableItemBackground};
            android.content.res.TypedArray ta =
                    context.obtainStyledAttributes(attrs);
            row.setBackgroundResource(ta.getResourceId(0, 0));
            ta.recycle();
        }
        parent.addView(row);
        return row;
    }

    /** Row with a switch on the right. */
    public static Switch addSwitchRow(Context context, ViewGroup parent, int icon, String title,
                                      String subtitle, boolean checked,
                                      final CompoundButton.OnCheckedChangeListener listener) {
        Switch sw = new Switch(context);
        addRow(context, parent, icon, title, subtitle, sw, null);
        sw.setChecked(checked);
        sw.setOnCheckedChangeListener(listener);
        return sw;
    }

    /** Row that opens something, with the current value on the right. */
    public static TextView addValueRow(Context context, ViewGroup parent, int icon, String title,
                                       String subtitle, String value,
                                       View.OnClickListener click) {
        TextView valueView = new TextView(context);
        valueView.setText(value);
        valueView.setTextColor(context.getResources().getColor(R.color.accent));
        valueView.setTextSize(13f);
        valueView.setTypeface(null, android.graphics.Typeface.BOLD);
        addRow(context, parent, icon, title, subtitle, valueView, click);
        return valueView;
    }

    /** Rounded chip used for the week-day and icon pickers. */
    public static TextView chip(Context context, String text, int widthDp) {
        TextView chip = new TextView(context);
        int w = dp(context, widthDp);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(w, w);
        lp.rightMargin = dp(context, 6);
        chip.setLayoutParams(lp);
        chip.setGravity(Gravity.CENTER);
        chip.setText(text);
        chip.setTextSize(13f);
        chip.setClickable(true);
        chip.setFocusable(true);
        chip.setBackgroundResource(R.drawable.shape_chip);
        return chip;
    }

    public static GradientDrawable circle(int color) {
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(color);
        return d;
    }

    /** Fades a view in with a small rise; used for card entrances. */
    public static void animateIn(View view, int delayMs) {
        view.setAlpha(0f);
        view.setTranslationY(24f);
        view.animate()
                .alpha(1f)
                .translationY(0f)
                .setStartDelay(delayMs)
                .setDuration(320)
                .setInterpolator(new android.view.animation.DecelerateInterpolator())
                .start();
    }
}
