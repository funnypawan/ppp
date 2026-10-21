package com.ronny.assistant.data;

import com.ronny.assistant.model.RoutineItem;

import java.util.ArrayList;
import java.util.List;

/**
 * Ronny's default day. Every message is the exact Hindi sentence the assistant
 * speaks at that time, and every item is stored locally so the whole routine
 * works with the internet switched off.
 */
public final class DefaultRoutine {

    private DefaultRoutine() {
    }

    public static final String[] ICON_CHOICES = {
            "⏰", "🌅", "🏃", "🍳", "📚", "🍱", "😴", "👨‍🏫",
            "🍽️", "🌙", "💧", "🧘", "📝", "🚿", "☕", "🎯"
    };

    public static List<RoutineItem> items() {
        List<RoutineItem> list = new ArrayList<RoutineItem>();
        list.add(make("Wake Up", "⏰", 4 * 60 + 30, -1,
                "Good morning Ronny! Uthne ka samay ho gaya hai. Apne din ki shuruaat energy ke saath kijiye."));
        list.add(make("Running", "🏃", 5 * 60, -1,
                "Hello Ronny! Running ka time ho gaya hai. Chaliye, exercise ke liye taiyar ho jaiye."));
        list.add(make("Breakfast", "🍳", 7 * 60, -1,
                "Hello Ronny! Breakfast ka time ho gaya hai. Apna nashta samay par kar lijiye."));
        list.add(make("Start Studying", "📚", 9 * 60, -1,
                "Hello Ronny! Padhai shuru karne ka samay ho gaya hai. Apne lakshya par dhyan dijiye."));
        list.add(make("Study Session Ends", "📝", 12 * 60, -1,
                "Hello Ronny! Aapka pehla study session poora ho gaya hai. Ab apne agle routine ke liye taiyar ho jaiye."));
        list.add(make("Lunch", "🍱", 13 * 60, -1,
                "Hello Ronny! Lunch ka time ho gaya hai. Khana samay par khaiye."));
        list.add(make("Rest", "😴", 13 * 60 + 5, 15 * 60,
                "Hello Ronny! Aaram karne ka samay ho gaya hai. Lunch ke baad thoda aaram kar lijiye, isse aapka dimaag fresh hoga."));
        list.add(make("Rest Ends", "☀️", 15 * 60, -1,
                "Hello Ronny! Aaram ka samay khatam ho gaya hai. Ab apne agle kaam ke liye taiyar ho jaiye."));
        list.add(make("Teaching", "👨‍🏫", 15 * 60 + 30, 17 * 60,
                "Hello Ronny! Teaching ka time ho gaya hai. Apna kaam poore focus ke saath shuru kijiye."));
        list.add(make("Teaching Ends", "🎯", 17 * 60, -1,
                "Hello Ronny! Teaching ka samay poora ho gaya hai. Ab apne agle routine ki taiyari kijiye."));
        list.add(make("Evening Meal", "🍽️", 18 * 60, -1,
                "Hello Ronny! Khana khane ka samay ho gaya hai. Apna meal aaram se enjoy kijiye."));
        list.add(make("Evening Study Session", "📚", 19 * 60, -1,
                "Hello Ronny! Shaam ki padhai ka samay ho gaya hai. Apne sapnon ko poora karne ke liye focus banaye rakhiye."));
        list.add(make("Sleep", "🌙", 21 * 60 + 30, -1,
                "Hello Ronny! Sone ka samay ho gaya hai. Phone side mein rakhiye aur achhi neend lijiye. "
                        + "Kal ek naya din aur naye goals aapka intezar kar rahe hain."));
        return list;
    }

    private static RoutineItem make(String title, String emoji, int start, int end, String message) {
        RoutineItem item = new RoutineItem(title, message, start, emoji);
        item.endMin = end;
        return item;
    }
}
