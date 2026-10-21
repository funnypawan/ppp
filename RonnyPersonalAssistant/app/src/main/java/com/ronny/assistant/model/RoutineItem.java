package com.ronny.assistant.model;

import com.ronny.assistant.util.TimeUtils;

import java.util.Calendar;

/** One entry of Ronny's daily routine. Times are minutes from local midnight. */
public class RoutineItem {

    public static final int NO_END = -1;

    public long id;
    public String title;
    /** The exact Hindi sentence spoken by the text-to-speech engine. */
    public String message;
    public int startMin;
    public int endMin = NO_END;
    public boolean enabled = true;
    /** Bit mask, bit 0 = Sunday ... bit 6 = Saturday. */
    public int days = TimeUtils.allDays();
    public String emoji = "⏰";
    /** One of the sound keys handled by {@link com.ronny.assistant.alarm.SoundPlayer}. */
    public String sound = "chime";
    public boolean voice = true;
    public int sortOrder = 0;

    public RoutineItem() {
    }

    public RoutineItem(String title, String message, int startMin, String emoji) {
        this.title = title;
        this.message = message;
        this.startMin = startMin;
        this.emoji = emoji;
    }

    public boolean repeatsToday() {
        return scheduledOn(TimeUtils.todayBit());
    }

    public boolean scheduledOn(int dayBit) {
        return (days & dayBit) != 0;
    }

    public String timeRangeLabel(boolean is24) {
        String start = TimeUtils.format(startMin, is24);
        if (endMin < 0 || endMin == startMin) {
            return start;
        }
        return start + "  –  " + TimeUtils.format(endMin, is24);
    }

    /** Where the reminder should sit relative to "now". */
    public int stateRelativeTo(int nowMin, boolean done, boolean fired) {
        if (done) {
            return 3; // completed
        }
        if (nowMin >= startMin && endMin > startMin && nowMin < endMin) {
            return 0; // happening now
        }
        if (fired) {
            return 2; // already rang, not marked done
        }
        return 1; // upcoming
    }

    /** Next Calendar instance at or after {@code now} on which this item is scheduled. */
    public Calendar nextTrigger(long now) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(now);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.set(Calendar.HOUR_OF_DAY, startMin / 60);
        c.set(Calendar.MINUTE, startMin % 60);
        for (int attempt = 0; attempt < 8; attempt++) {
            if (c.getTimeInMillis() > now && (days & TimeUtils.dayBit(c.get(Calendar.DAY_OF_WEEK))) != 0) {
                return c;
            }
            c.add(Calendar.DAY_OF_YEAR, 1);
        }
        return c;
    }

    public String spokenText(String userName) {
        if (message != null && message.trim().length() > 0) {
            return message;
        }
        return "Hello " + userName + "! Aapka " + title + " karne ka samay ho gaya hai.";
    }

    @Override
    public String toString() {
        return TimeUtils.to24(startMin) + " " + title;
    }
}
