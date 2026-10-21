import com.ronny.assistant.model.RoutineItem;
import com.ronny.assistant.data.DefaultRoutine;
import com.ronny.assistant.util.TimeUtils;
import java.util.*;

public class LogicTest {
    static int failures = 0;
    static void check(String label, Object actual, Object expected) {
        boolean ok = String.valueOf(actual).equals(String.valueOf(expected));
        if (!ok) failures++;
        System.out.println((ok ? "  PASS  " : "  FAIL  ") + label + " -> " + actual
            + (ok ? "" : "   (expected " + expected + ")"));
    }

    public static void main(String[] args) {
        System.out.println("== TimeUtils");
        check("to24(4*60+30)", TimeUtils.to24(4*60+30), "04:30");
        check("to24(21*60+30)", TimeUtils.to24(21*60+30), "21:30");
        check("to24(0)", TimeUtils.to24(0), "00:00");
        check("format(13*60, 24h)", TimeUtils.format(13*60, true), "13:00");
        check("format(13*60, 12h)", TimeUtils.format(13*60, false), "1:00 PM");
        check("format(0, 12h)", TimeUtils.format(0, false), "12:00 AM");
        check("format(12*60, 12h)", TimeUtils.format(12*60, false), "12:00 PM");
        check("countdown(2h5m)", TimeUtils.countdown((2*3600+5*60)*1000L), "2h 05m");
        check("countdown(65s)", TimeUtils.countdown(65*1000L), "1m 05s");
        check("countdown(45s)", TimeUtils.countdown(45*1000L), "45s");
        check("allDays", TimeUtils.allDays(), 127);
        check("weekdays", TimeUtils.weekdays(), 0x3E);
        check("daysLabel(127)", TimeUtils.daysLabel(127), "Every day");
        check("daysLabel(0x3E)", TimeUtils.daysLabel(0x3E), "Mon – Fri");
        check("dayBit(SUNDAY)", TimeUtils.dayBit(Calendar.SUNDAY), 1);
        check("dayBit(SATURDAY)", TimeUtils.dayBit(Calendar.SATURDAY), 64);

        System.out.println("\n== Default routine");
        List<RoutineItem> items = DefaultRoutine.items();
        check("item count", items.size(), 13);
        int previous = -1;
        for (RoutineItem item : items) {
            boolean ordered = item.startMin >= previous;
            if (!ordered) failures++;
            System.out.printf("  %s %-24s %-24s %s%n",
                ordered ? "PASS" : "FAIL",
                TimeUtils.to24(item.startMin), item.title, item.emoji);
            previous = item.startMin;
        }
        check("04:30 Wake Up", items.get(0).startMin, 4*60+30);
        check("05:00 Running", items.get(1).startMin, 5*60);
        check("07:00 Breakfast", items.get(2).startMin, 7*60);
        check("09:00 Studying", items.get(3).startMin, 9*60);
        check("12:00 Session ends", items.get(4).startMin, 12*60);
        check("13:00 Lunch", items.get(5).startMin, 13*60);
        check("13:05 Rest", items.get(6).startMin, 13*60+5);
        check("15:00 Rest ends", items.get(7).startMin, 15*60);
        check("15:30 Teaching", items.get(8).startMin, 15*60+30);
        check("17:00 Teaching ends", items.get(9).startMin, 17*60);
        check("18:00 Evening meal", items.get(10).startMin, 18*60);
        check("19:00 Evening study", items.get(11).startMin, 19*60);
        check("21:30 Sleep", items.get(12).startMin, 21*60+30);
        check("Rest end time", items.get(6).endMin, 15*60);

        String wake = items.get(0).message;
        check("wake message", wake,
            "Good morning Ronny! Uthne ka samay ho gaya hai. Apne din ki shuruaat energy ke saath kijiye.");
        check("running message", items.get(1).message,
            "Hello Ronny! Running ka time ho gaya hai. Chaliye, exercise ke liye taiyar ho jaiye.");
        check("sleep message", items.get(12).message,
            "Hello Ronny! Sone ka samay ho gaya hai. Phone side mein rakhiye aur achhi neend lijiye. "
            + "Kal ek naya din aur naye goals aapka intezar kar rahe hain.");

        System.out.println("\n== Every message is present and non-empty");
        for (RoutineItem item : items) {
            boolean ok = item.message != null && item.message.trim().length() > 20;
            if (!ok) failures++;
            System.out.println("  " + (ok ? "PASS" : "FAIL") + "  " + item.title
                + " (" + (item.message == null ? 0 : item.message.length()) + " chars)");
        }

        System.out.println("\n== nextTrigger skips to the next allowed day");
        // Wednesday 2026-10-21 08:00 local
        Calendar base = Calendar.getInstance();
        base.clear();
        base.set(2026, Calendar.OCTOBER, 21, 8, 0, 0);
        long now = base.getTimeInMillis();

        RoutineItem daily = items.get(3); // 09:00 every day
        daily.days = TimeUtils.allDays();
        Calendar next = daily.nextTrigger(now);
        check("daily 09:00 same day -> hour", next.get(Calendar.HOUR_OF_DAY), 9);
        check("daily 09:00 same day -> date", next.get(Calendar.DAY_OF_MONTH), 21);

        RoutineItem weekdayOnly = new RoutineItem("Study", "x", 9*60, "x");
        weekdayOnly.days = TimeUtils.weekdays(); // Mon-Fri
        // 2026-10-24 is a Saturday
        Calendar sat = Calendar.getInstance();
        sat.clear();
        sat.set(2026, Calendar.OCTOBER, 24, 10, 0, 0);
        Calendar nextSat = weekdayOnly.nextTrigger(sat.getTimeInMillis());
        check("Mon-Fri from Saturday -> Monday",
                nextSat.get(Calendar.DAY_OF_WEEK), Calendar.MONDAY);
        check("Mon-Fri from Saturday -> 09:00", nextSat.get(Calendar.HOUR_OF_DAY), 9);

        RoutineItem weekendOnly = new RoutineItem("Long run", "x", 7*60, "x");
        weekendOnly.days = TimeUtils.weekend();
        Calendar mon = Calendar.getInstance();
        mon.clear();
        mon.set(2026, Calendar.OCTOBER, 19, 6, 0, 0); // Monday
        Calendar nextMon = weekendOnly.nextTrigger(mon.getTimeInMillis());
        check("weekend-only from Monday -> Saturday",
                nextMon.get(Calendar.DAY_OF_WEEK), Calendar.SATURDAY);

        System.out.println("\n== RoutineItem states");
        RoutineItem rest = items.get(6); // 13:05 - 15:00
        check("state at 14:00 (in progress)", rest.stateRelativeTo(14*60, false, true), 0);
        check("state at 12:00 (upcoming)", rest.stateRelativeTo(12*60, false, false), 1);
        check("state at 16:00 (missed)", rest.stateRelativeTo(16*60, false, true), 2);
        check("state when done", rest.stateRelativeTo(16*60, true, true), 3);
        check("time range", rest.timeRangeLabel(true), "13:05  –  15:00");
        check("fallback spoken text",
                new RoutineItem("Yoga", "", 600, "x").spokenText("Ronny"),
                "Hello Ronny! Aapka Yoga karne ka samay ho gaya hai.");

        System.out.println("\n== dayKey");
        Calendar d = Calendar.getInstance();
        d.clear();
        d.set(2026, Calendar.OCTOBER, 21, 23, 59, 0);
        check("dayKey 2026-10-21", TimeUtils.dayKey(d.getTimeInMillis()), "2026-10-21");

        System.out.println("\n" + (failures == 0
                ? "ALL LOGIC CHECKS PASSED" : failures + " CHECK(S) FAILED"));
        if (failures != 0) System.exit(1);
    }
}
