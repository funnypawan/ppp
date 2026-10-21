package com.ronny.assistant.ai;

import android.content.Context;

import com.ronny.assistant.R;
import com.ronny.assistant.data.Prefs;
import com.ronny.assistant.data.RoutineDb;
import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.util.TimeUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * The offline Hindi motivational brain.
 *
 * It never touches the schedule: reading the routine is allowed, changing it
 * always needs Ronny's explicit action in the Routine screen.
 */
public final class MotivationEngine {

    private static final String[] GENERAL = {
            "Ronny, discipline woh hai jo aapko tab bhi aage badhata hai jab mann na kare. Ek chhota kadam aaj uthaiye.",
            "Hello Ronny! Bade sapne chhote regular kadamon se bante hain. Aaj ka ek kaam poora kar dijiye.",
            "Ronny, aapki mehnat aapke future ki nayi shuruaat hai. Aaj himmat mat haariye.",
            "Hello Ronny! Har din ek naya mauka hai apne aap ko behtar banane ka. Abhi shuru kijiye.",
            "Ronny, jab aap apne routine ke saath sachche rahte hain, tab success aapke aage kuch nahi kar paati.",
            "Hello Ronny! Thoda focus, thoda samay, aur aap wahan pahunch jayenge jahan aap sapne dekhte hain."
    };

    private static final String[] WHEN_AHEAD = {
            "Ronny, aaj aapne bahut achha kiya hai. Isi raftaar ko banaye rakhiye!",
            "Shabash Ronny! Aap aaj apne routine se aage hain. Apne aap par garv kijiye.",
            "Hello Ronny! Aapka consistency record khoobsoorat hai. Aaj ke bache hue kaam bhi nipta lijiye."
    };

    private static final String[] WHEN_BEHIND = {
            "Ronny, der ho sakti hai par haar nahi. Abhi ek chhota kaam shuru kar dijiye.",
            "Hello Ronny! Jo ho gaya so ho gaya. Ab agle kaam par poora dhyan dijiye.",
            "Ronny, perfect din ki zaroorat nahi, bas ek aur sahi kadam ki zaroorat hai. Chaliye shuru karein."
    };

    private static final String[] DISCIPLINE = {
            "Ronny, discipline ke liye chahe nahi, bas routine rakhiye. Alarm bajte hi uth kar ek kaam turant shuru kijiye.",
            "Hello Ronny! Phone ko door rakhiye, timer lagaiye, aur 25 minute tak sirf ek kaam kijiye.",
            "Ronny, har shaam apne agle din ke teen sabse zaroori kaam likh dijiye. Subah sochna hi nahi padega.",
            "Hello Ronny! Neend, paani aur exercise ko routine ka hissa banaiye. Tabhi energy barkarar rahegi.",
            "Ronny, discipline ek din mein nahi banti. Roz thoda thoda karke aap apne aap ko jeet lijiye."
    };

    private static final String[] NIGHT = {
            "Ronny, ab aaram ka samay hai. Phone door rakhiye aur achhi neend lijiye, kal aur taakat ke saath aayenge.",
            "Hello Ronny! Aaj ki mehnat ka hisaab kal milega. Abhi so jaiye, kal phir shuruat karenge."
    };

    private static final String[] MORNING = {
            "Good morning Ronny! Naye din ki shuruaat ek gehri saans aur ek saaf iraade se kijiye.",
            "Hello Ronny! Aaj ka pehla kaam turant kar lijiye, poori din ki jeet wahin se shuru hoti hai."
    };

    private MotivationEngine() {
    }

    /** Deterministic-enough local reply. No network needed. */
    public static String reply(Context context, String question) {
        String q = question == null ? "" : question.toLowerCase().trim();
        Prefs prefs = Prefs.get(context);
        RoutineDb db = RoutineDb.get(context);
        String day = TimeUtils.dayKey();
        List<RoutineItem> items = db.all();
        int done = db.doneCount(day);
        Random random = new Random();

        if (contains(q, "next", "aage", "agle", "abhi", "kya karna", "kya hai")) {
            return nextTask(context, items, db, day);
        }
        if (contains(q, "progress", "kitna", "status", "percent", "kaise chal", "report")) {
            return progress(context, items, done);
        }
        if (contains(q, "discipline", "focus", "dhyan", "motivation", "motivate", "himmat", "tips")) {
            return pick(DISCIPLINE, random);
        }
        if (contains(q, "sleep", "sona", "neend", "night", "so jao")) {
            return pick(NIGHT, random);
        }
        if (contains(q, "morning", "subah", "good morning", "wake", "uthna")) {
            return pick(MORNING, random);
        }
        if (contains(q, "tired", "thak", "bore", "mana", "give up", "haar")) {
            return pick(WHEN_BEHIND, random);
        }
        String name = prefs.userName();
        if (done >= Math.max(1, items.size() / 2)) {
            return pick(WHEN_AHEAD, random);
        }
        if (done == 0 && items.size() > 0) {
            RoutineItem next = nextUp(items, db, day);
            if (next != null) {
                return "Ronny, aaj ka pehla kaam " + next.title + " hai, " + TimeUtils.format(context, next.startMin)
                        + " par. Bas itna kar lijiye, baaki aap khud ho jayega.";
            }
        }
        return pick(GENERAL, random) + " " + name + ", main hamesha aapke saath hoon.";
    }

    private static boolean contains(String q, String... needles) {
        for (String n : needles) {
            if (q.contains(n)) {
                return true;
            }
        }
        return false;
    }

    public static RoutineItem nextUp(List<RoutineItem> items) {
        return nextUp(items, null, null);
    }

    private static RoutineItem nextUp(List<RoutineItem> items, RoutineDb db, String day) {
        int now = TimeUtils.nowMinutes();
        RoutineItem best = null;
        for (RoutineItem item : items) {
            if (!item.enabled || !item.repeatsToday()) {
                continue;
            }
            if (db != null && day != null && db.isDone(day, item.id)) {
                continue;
            }
            if (item.startMin >= now && (best == null || item.startMin < best.startMin)) {
                best = item;
            }
        }
        return best;
    }

    private static String nextTask(Context context, List<RoutineItem> items, RoutineDb db, String day) {
        RoutineItem next = nextUp(items, db, day);
        if (next == null) {
            return "Ronny, aaj ke saare kaam poore ho gaye hain. Ab aaram kijiye aur kal ke liye taiyar ho jaiye.";
        }
        return "Hello Ronny! Aapka agla kaam " + next.title + " hai, "
                + TimeUtils.format(context, next.startMin) + " par. "
                + "Taiyar ho jaiye, hum dono milkar ise poora karenge.";
    }

    private static String progress(Context context, List<RoutineItem> items, int done) {
        int total = items.size();
        int percent = total == 0 ? 0 : (int) Math.round(done * 100.0 / total);
        if (total == 0) {
            return "Ronny, abhi koi activity set nahi hai. Routine screen se apna din banaiye.";
        }
        if (percent >= 100) {
            return "Ronny, aaj " + percent + "% complete hai. Poori tarah discipline! Ab aaram kijiye.";
        }
        if (percent >= 60) {
            return "Ronny, aaj " + done + " se " + total + " kaam poore ho gaye hain, yani " + percent
                    + "% complete. Bahut achha chal rahe hain, bas isi gagun ko pakde rakhiye.";
        }
        return "Ronny, aaj " + done + " se " + total + " kaam poore hue hain, yani " + percent
                + "%. Abhi waqt hai, agla kaam shuru kar dijiye.";
    }

    public static String[] suggestions(Context context) {
        return new String[]{
                context.getString(R.string.cmd_next),
                context.getString(R.string.cmd_progress),
                context.getString(R.string.cmd_motivate),
                context.getString(R.string.cmd_discipline)
        };
    }

    private static String pick(String[] pool, Random random) {
        return pool[random.nextInt(pool.length)];
    }

    /** Convenience list used by the assistant chips. */
    public static List<String> quickReplies(Context context) {
        List<String> out = new ArrayList<String>();
        String[] s = suggestions(context);
        for (String value : s) {
            out.add(value);
        }
        return out;
    }
}
