package com.ronny.assistant.util;

import android.content.Context;
import android.text.format.DateFormat;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/** Small helpers for the minute-of-day representation used everywhere in this app. */
public final class TimeUtils {

    public static final int MINUTES_IN_DAY = 24 * 60;

    private TimeUtils() {
    }

    public static String two(int n) {
        return n < 10 ? "0" + n : Integer.toString(n);
    }

    /** "04:30" always in 24-hour form (used for storage and sorting). */
    public static String to24(int minutes) {
        int m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
        return two(m / 60) + ":" + two(m % 60);
    }

    /** User facing time, honouring the phone's 12/24-hour setting. */
    public static String format(Context context, int minutes) {
        boolean is24 = DateFormat.is24HourFormat(context);
        return format(minutes, is24);
    }

    public static String format(int minutes, boolean is24) {
        int m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
        int h = m / 60;
        int min = m % 60;
        if (is24) {
            return two(h) + ":" + two(min);
        }
        String suffix = h < 12 ? "AM" : "PM";
        int h12 = h % 12;
        if (h12 == 0) {
            h12 = 12;
        }
        return h12 + ":" + two(min) + " " + suffix;
    }

    public static int nowMinutes() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }

    /** Bit value for a {@link Calendar} day-of-week constant (Calendar.SUNDAY .. SATURDAY). */
    public static int dayBit(int calendarDay) {
        return 1 << (calendarDay - 1);
    }

    public static int todayBit() {
        return dayBit(Calendar.getInstance().get(Calendar.DAY_OF_WEEK));
    }

    public static int allDays() {
        return 0x7F;
    }

    public static int weekdays() {
        return 0x3E;
    }

    public static int weekend() {
        return dayBit(Calendar.SUNDAY) | dayBit(Calendar.SATURDAY);
    }

    /** Local day key such as "2026-10-21". All per-day state is keyed on this. */
    public static String dayKey() {
        return dayKey(System.currentTimeMillis());
    }

    public static String dayKey(long millis) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(millis);
        return c.get(Calendar.YEAR) + "-" + two(c.get(Calendar.MONTH) + 1) + "-"
                + two(c.get(Calendar.DAY_OF_MONTH));
    }

    public static String longDate() {
        return new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault())
                .format(Calendar.getInstance().getTime());
    }

    /** Human countdown: "2h 05m", "18m 40s" or "45s". */
    public static String countdown(long millis) {
        if (millis < 0) {
            millis = 0;
        }
        long total = millis / 1000L;
        long h = total / 3600L;
        long m = (total % 3600L) / 60L;
        long s = total % 60L;
        if (h > 0) {
            return h + "h " + two((int) m) + "m";
        }
        if (m > 0) {
            return m + "m " + two((int) s) + "s";
        }
        return s + "s";
    }

    /** Short weekday labels ordered Sunday-first, matching {@link #dayBit(int)}. */
    public static String[] dayLabels() {
        return new String[]{"S", "M", "T", "W", "T", "F", "S"};
    }

    public static String daysLabel(int mask) {
        if (mask == 0) {
            return "Never";
        }
        if (mask == allDays()) {
            return "Every day";
        }
        if (mask == weekdays()) {
            return "Mon – Fri";
        }
        if (mask == weekend()) {
            return "Weekends";
        }
        String[] names = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 7; i++) {
            if ((mask & (1 << i)) != 0) {
                if (sb.length() > 0) {
                    sb.append(", ");
                }
                sb.append(names[i]);
            }
        }
        return sb.toString();
    }

    /** Greeting token for the dashboard header. */
    public static int greetingKind() {
        int h = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        if (h < 12) {
            return 0; // morning
        }
        if (h < 17) {
            return 1; // afternoon
        }
        if (h < 21) {
            return 2; // evening
        }
        return 3; // night
    }
}
