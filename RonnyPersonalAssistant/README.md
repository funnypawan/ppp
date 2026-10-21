# Ronny Personal Assistant

A complete, working Android app that reminds **Ronny** about every activity in
his day with a pleasant alarm tone, a visible notification and a natural Hindi
voice announcement.

> "Hello Ronny! Aapka running karne ka time ho gaya hai. Chaliye, apni sehat ko
> behtar banane ke liye running shuru karein!"

* Package: `com.ronny.assistant`
* minSdk 26 (Android 8.0) · targetSdk 34 (Android 14)
* **Zero third-party libraries** — 100 % Android framework, so the APK is small
  (~1.1 MB), private and battery friendly
* Works offline. The internet is used only by the optional AI assistant.

---

## 1. Ronny's default routine (pre-installed)

| Time | Activity | Hindi voice message |
|---|---|---|
| 04:30 | Wake Up | "Good morning Ronny! Uthne ka samay ho gaya hai. Apne din ki shuruaat energy ke saath kijiye." |
| 05:00 | Running | "Hello Ronny! Running ka time ho gaya hai. Chaliye, exercise ke liye taiyar ho jaiye." |
| 07:00 | Breakfast | "Hello Ronny! Breakfast ka time ho gaya hai. Apna nashta samay par kar lijiye." |
| 09:00 | Start Studying | "Hello Ronny! Padhai shuru karne ka samay ho gaya hai. Apne lakshya par dhyan dijiye." |
| 12:00 | Study Session Ends | "Hello Ronny! Aapka pehla study session poora ho gaya hai. Ab apne agle routine ke liye taiyar ho jaiye." |
| 13:00 | Lunch | "Hello Ronny! Lunch ka time ho gaya hai. Khana samay par khaiye." |
| 13:05 – 15:00 | Rest | "Hello Ronny! Aaram karne ka samay ho gaya hai. Lunch ke baad thoda aaram kar lijiye…" |
| 15:00 | Rest Ends | "Hello Ronny! Aaram ka samay khatam ho gaya hai. Ab apne agle kaam ke liye taiyar ho jaiye." |
| 15:30 | Teaching | "Hello Ronny! Teaching ka time ho gaya hai. Apna kaam poore focus ke saath shuru kijiye." |
| 17:00 | Teaching Ends | "Hello Ronny! Teaching ka samay poora ho gaya hai. Ab apne agle routine ki taiyari kijiye." |
| 18:00 | Evening Meal | "Hello Ronny! Khana khane ka samay ho gaya hai. Apna meal aaram se enjoy kijiye." |
| 19:00 | Evening Study Session | "Hello Ronny! Shaam ki padhai ka samay ho gaya hai. Apne sapnon ko poora karne ke liye focus banaye rakhiye." |
| 21:30 | Sleep | "Hello Ronny! Sone ka samay ho gaya hai. Phone side mein rakhiye aur achhi neend lijiye. Kal ek naya din aur naye goals aapka intezar kar rahe hain." |

Every message includes Ronny's name and is spoken in Hindi (hi-IN); the language
is selectable in Settings.

---

## 2. Features

**Reminders**
* Real `AlarmManager` alarm-clock alarms that survive Doze
* Pleasant bundled tones: Morning Chime, Soft Bell, Sunrise Pad (+ phone alarm /
  notification sound / silent)
* Android Text-to-Speech in natural Hindi with adjustable rate, pitch and volume
* Big notification with the activity name, the scheduled time and the message
* **Done** and **Snooze** buttons directly on the notification (5 / 10 / 15 / 20 / 30 min)
* Full-screen ringing screen that turns the screen on and works on the lock screen
* Duplicate protection: one row per activity per day in SQLite, so a reboot, a
  clock change or an extra reschedule can never ring the same event twice
* Re-armed automatically after reboot, app update, time / date / timezone change
  and exact-alarm permission changes

**Dashboard**
* "Good Morning, Ronny!" greeting, live clock, full date
* Next activity with a live countdown
* Today's completion percentage and progress bar
* Complete routine timeline with NOW / DONE / MISSED / UPCOMING states
* One-tap preview: hear exactly how a reminder will sound

**Routine management**
Add, edit, delete, change times, set a start *and* end time, enable/disable
individual reminders, choose repeat days (every day / weekdays / weekends /
custom), pick an icon and a per-activity sound. Everything is stored in SQLite.

**Settings**
Master switch, voice on/off, reminder sound, snooze duration, reminder
behaviour (sound + voice / sound only / voice only / silent), reminder volume,
voice language, speech rate and pitch, voice test, Hindi TTS data install link,
optional online AI, and a reset back to the default routine.

**AI assistant (optional)**
Offline Hindi motivational brain that answers "what's next?", "how is my day
going?", discipline tips and free-form questions. Optionally talks to *your own*
backend (see `backend/`) for personalised replies. **It can read the routine but
can never change it** — only Ronny can, from the Routine screen.

---

## 3. Project layout

```
RonnyPersonalAssistant/
├── app/src/main/
│   ├── AndroidManifest.xml
│   ├── java/com/ronny/assistant/
│   │   ├── App.java                     startup, channels, re-arm alarms
│   │   ├── model/RoutineItem.java       one routine activity
│   │   ├── data/
│   │   │   ├── RoutineDb.java           SQLite: routine, progress, fired guard
│   │   │   ├── Prefs.java               every setting
│   │   │   └── DefaultRoutine.java      Ronny's 13 default activities
│   │   ├── alarm/
│   │   │   ├── AlarmScheduler.java      AlarmManager (setAlarmClock + fallback)
│   │   │   ├── AlarmReceiver.java       dedupe + start the reminder
│   │   │   ├── ReminderService.java     foreground service: sound, voice, notif
│   │   │   ├── ActionReceiver.java      Done / Snooze notification buttons
│   │   │   ├── RestartReceiver.java     boot / update / clock changes
│   │   │   ├── Notifier.java            channels + notification builders
│   │   │   ├── SoundPlayer.java         bundled and system tones
│   │   │   └── Speech.java              TextToSpeech wrapper
│   │   ├── ui/                          MainActivity, Routine, Edit, Settings,
│   │   │                                Assistant, Reliability, Alarm, Permissions
│   │   ├── ai/                          MotivationEngine (offline) + Client
│   │   └── util/                        TimeUtils, Ui
│   └── res/                             layouts, drawables, values, raw tones
├── backend/server.py                    optional AI proxy (holds the API key)
├── tools/
│   ├── offline-build.py                 Gradle-free APK builder
│   ├── fetch-toolchain.py               downloads aapt2 / d8 / apksigner / javac
│   ├── make_sounds.py                   regenerates res/raw/*.wav
│   └── tests/LogicTest.java             scheduling + message unit tests
└── docs/                                build, install and test instructions
```

---

## 4. Build the APK

### A. Android Studio (recommended)

1. File → Open → select the `RonnyPersonalAssistant` folder.
2. Let Gradle sync (it will fetch the Android Gradle Plugin).
3. **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
   Output: `app/build/outputs/apk/debug/app-debug.apk`

From the command line instead:

```bash
cd RonnyPersonalAssistant
./gradlew assembleDebug     # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease   # unsigned release, needs your keystore
```

You need `local.properties` with `sdk.dir=/path/to/Android/Sdk`
(copy `local.properties.example`).

### B. Without Gradle / Android Studio

```bash
cd RonnyPersonalAssistant
python3 tools/fetch-toolchain.py     # one-off: aapt2, d8, apksigner, android.jar, javac
python3 tools/offline-build.py       # -> release/RonnyPersonalAssistant.apk
```

`offline-build.py` compiles resources with **aapt2**, compiles Java, dexes with
**d8**, zipaligns and signs with **apksigner** (v1 + v2, RSA-2048). It needs
Python 3 and any JDK 8+.

The pre-built APK is committed here:

```
release/RonnyPersonalAssistant.apk
```

---

## 5. Install it

```bash
adb install -r release/RonnyPersonalAssistant.apk
```

Or copy the APK to the phone and tap it (allow "Install unknown apps" for your
file manager). Requires Android 8.0 (API 26) or newer.

See **[docs/BUILD_AND_INSTALL.md](docs/BUILD_AND_INSTALL.md)** and
**[docs/TESTING.md](docs/TESTING.md)** for the full walk-through, including how
to test every single reminder in a couple of minutes without waiting all day.

---

## 6. Honest note about Android alarms

Android throttles background work to save battery. This app uses the correct
APIs (exact alarm clock + a `mediaPlayback` foreground service, which is exempt
from Android 12's background-start restrictions), **but the phone must allow a
few things** or reminders can be late or silent:

1. **Notifications** — required on Android 13+.
2. **Alarms & reminders** (exact alarms) — Android 12+.
3. **Battery optimisation off** for this app — otherwise Doze can delay alarms.
4. **Auto-start / background activity** on Xiaomi, Redmi, Oppo, Vivo, Realme,
   Samsung and Huawei — OEM battery managers are stricter than stock Android.
5. **Hindi speech data installed** for the voice reminders.

The app never claims otherwise: open **Settings → Reliability** and it shows the
real state of each item and deep-links to the exact system page that fixes it.

---

## 7. Privacy

* No analytics, no ads, no crash SDK, no trackers.
* The routine lives in a local SQLite database on the phone.
* No data leaves the device unless you switch on the optional online assistant.
* The optional AI backend holds the API key, never the app.
* Permissions requested: notifications, exact alarms, boot completed, wake lock,
  foreground service, vibrate, internet (optional AI only). No location, no
  contacts, no storage, no microphone, no camera.
