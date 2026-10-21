# How to test every reminder

You do **not** have to wait until 04:30 to check the app. Use the three levels
below, from fastest to most realistic.

Before anything else, from `Settings → Reliability` make sure these say
**Allowed**: notifications, exact alarms, battery optimisation. Then install
Hindi speech data if it is flagged.

---

## Level 1 — Instant check of sound, voice and notification (30 seconds)

1. Open the app.
2. In **Today's routine**, tap the small **▶** on the right of any activity.
   → You hear its tone and its exact Hindi sentence, and see a toast. Do this
   for all 13 activities to hear every message.
3. Go to **Settings → Reminder sound** and try *Morning Chime*, *Soft Bell* and
   *Sunrise Pad*.
4. Go to **Settings → Test voice** to hear the Hindi voice alone.
5. Go to **Settings → Reminder behaviour** and check Sound only / Voice only /
   Silent.

Expected: a pleasant 2–4 second tone, then a clear Hindi sentence that starts
with "Hello Ronny!" or "Good morning Ronny!".

---

## Level 2 — Test the alarm pipeline with a temporary activity (2 minutes)

This exercises the *real* path: `AlarmManager` → `AlarmReceiver` →
`ReminderService` → notification + sound + voice.

1. **My Routine → +**
2. Name it `Test Alarm`, set the start time to **2 minutes from now**, choose
   the sound, leave the message as the default, tap **Save**.
3. Lock the phone (or press Home) and wait.
4. Within a few seconds of the time you should get:
   * the tone,
   * the Hindi voice line,
   * the notification with the activity name, time and message,
   * the full ringing screen if the phone is locked.
5. Test the buttons:
   * **Snooze** → the reminder goes quiet and comes back after the snooze
     duration (Settings → Snooze duration). You also get a "Snoozed: … Next
     alert at HH:MM" notification.
   * **Done** → "Marked as done. Shabash, Ronny!" and the activity turns green
     in the dashboard timeline.
6. Delete the test activity when you are finished.

### Duplicate protection

Leave the test activity armed, then reboot the phone. It must ring **once**,
not twice. That is the `fired` table doing its job.

---

## Level 3 — Verify the day without waiting 24 hours

Use adb to move the clock. Alarms are re-armed automatically on
`TIME_SET`, so this is a faithful simulation.

```bash
# 04:29 in the morning - one minute before Wake Up
adb shell su 0 date 102604292026.00     # MMDDhhmmYYYY.ss
# wait ~70 seconds -> Wake Up must fire

adb shell su 0 date 102604592026.00     # 04:59 -> Running fires at 05:00
```

If `su` is unavailable on your phone, use `Settings → System → Date & time`,
turn off *Automatic date & time*, set the clock manually, then turn it back on
afterwards.

A faster alternative that does not need root: create temporary activities 1–2
minutes apart and walk through them (Level 2 repeated).

### Checklist for the full day

| Time | Activity | Sound | Voice | Notification | Done | Snooze |
|---|---|---|---|---|---|---|
| 04:30 | Wake Up | ☐ | ☐ | ☐ | ☐ | ☐ |
| 05:00 | Running | ☐ | ☐ | ☐ | ☐ | ☐ |
| 07:00 | Breakfast | ☐ | ☐ | ☐ | ☐ | ☐ |
| 09:00 | Start Studying | ☐ | ☐ | ☐ | ☐ | ☐ |
| 12:00 | Study Session Ends | ☐ | ☐ | ☐ | ☐ | ☐ |
| 13:00 | Lunch | ☐ | ☐ | ☐ | ☐ | ☐ |
| 13:05 | Rest begins | ☐ | ☐ | ☐ | ☐ | ☐ |
| 15:00 | Rest Ends | ☐ | ☐ | ☐ | ☐ | ☐ |
| 15:30 | Teaching | ☐ | ☐ | ☐ | ☐ | ☐ |
| 17:00 | Teaching Ends | ☐ | ☐ | ☐ | ☐ | ☐ |
| 18:00 | Evening Meal | ☐ | ☐ | ☐ | ☐ | ☐ |
| 19:00 | Evening Study Session | ☐ | ☐ | ☐ | ☐ | ☐ |
| 21:30 | Sleep | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## Level 4 — Offline behaviour

1. Turn on **Airplane mode**.
2. Repeat Level 2.
   → The alarm, sound, voice, notification, Done and Snooze must all work
   exactly the same. Open the AI assistant: it still answers, and the header
   says *Offline assistant*.
3. Turn Airplane mode back off.

## Level 5 — Restart survival

1. Arm a test activity 3 minutes ahead, then **reboot** the phone immediately.
2. Do not open the app after boot.
3. The reminder must fire on time.
   (`RestartReceiver` listens for `BOOT_COMPLETED` and re-arms everything from
   SQLite.)

On Xiaomi / Redmi / Oppo / Vivo / Realme / Huawei you must also enable
**Auto-start** for the app in the phone's own security / battery app, otherwise
the OEM kills the receiver. The Reliability screen links to App info for this.

## Level 6 — Master switch and permissions

1. **Settings → Enable all reminders → off**, then wait for a scheduled time.
   → Nothing rings (this is intentional).
2. Turn it back on → the dashboard status pill changes and everything re-arms.
3. Revoke the notification permission in Android settings → the Reliability
   screen says *Needs attention* and deep-links to the fix.
4. Revoke "Alarms & reminders" on Android 12+ → the dashboard pill shows
   *Exact alarms off*. Alarms still fire, but only approximately; the app
   says so instead of pretending otherwise.

---

## Automated checks

```bash
python3 tools/run-tests.py
```

Runs the scheduling and message unit tests (time formatting, countdown, the 13
default activities with their exact Hindi sentences, next-trigger day skipping
for weekday/weekend masks, timeline states).

```bash
python3 -c "
import zipfile,subprocess
z=zipfile.ZipFile('release/RonnyPersonalAssistant.apk')
print([n for n in z.namelist() if n.endswith('.dex')])
"
```

Confirms the APK contains a single `classes.dex` (no multidex needed).

---

## If something does not fire

1. `adb logcat | grep -i ronny` — the app logs every schedule pass and every
   suppressed duplicate.
2. Check `Settings → Reliability` again; on Android 12+ and on OEM phones this
   is the cause in almost every case.
3. Confirm the activity is enabled and today is ticked in its repeat days
   (My Routine → edit → day chips).
4. Confirm the master switch is on and the reminder behaviour is not *Silent*.
5. If the sound plays but the voice does not: install Hindi (India) speech data
   from `Settings → Hindi speech data → Text-to-Speech settings`.
