# FocusLock – Smart App Time Limiter

A complete, working Android app (Kotlin, Material Design 3) that lets you set an
**individual daily usage limit for every installed app**. When an app reaches its
limit, FocusLock blocks it until midnight. A strictly-controlled
**Emergency Access** feature grants exactly **3 sessions of 10 minutes per day**
for situations where you genuinely need a blocked app.

- **Platform:** Android 8.0 (API 26) and above
- **Language:** Kotlin
- **Builds with:** Android Studio, Gradle CLI, and AndroidIDE (on-phone)

Developed by **ronny raj** · funnypawan8@gmail.com

---

## Features

| Area | What FocusLock does |
|---|---|
| **All Apps dashboard** | Every launchable installed app with icon, name, today's usage, daily limit, remaining time, progress bar, protection status, edit button and on/off switch. Search, sort by highest usage or A–Z, filter by with/without limits or exempt. |
| **Per-app limits** | A different daily limit for every app (Instagram 30m, YouTube 60m, …). Quick presets 5m–2h or a custom hours/minutes picker. Saved persistently in a local Room database. |
| **Editing limits** | Edit any time. Shows current limit + today's usage and a live "remaining after saving" preview (used 25m, limit 30m→60m = 35m left). Lowering a limit below current usage blocks the app immediately. Usage is never reset by editing (an explicit, separate "reset today's counted usage" option exists). Turning a limit off always asks for confirmation. |
| **Real blocking** | Two enforcement layers: (1) an AccessibilityService that reacts the instant a blocked app comes to the foreground, (2) a foreground monitor service polling `UsageStatsManager` every 2 s, which also catches apps that reach their limit *mid-session*. A full-screen blocking screen shows the app name, today's usage, the limit, the next reset time, Emergency Access and Return to Home. |
| **Emergency Access** | Exactly **3 sessions/day × exactly 10 minutes**. Manual start behind a confirmation dialog, visible countdown (in-app + notification), one app per session, one session at a time, no extensions, no limit changes. The countdown is stored as absolute wall-clock timestamps, so leaving the app, force-closing FocusLock or rebooting the phone can never extend or reset it. After 3 sessions: *"You have used all 3 emergency sessions for today."* Allowance resets at local midnight. |
| **Daily reset** | Everything is keyed by the local calendar date (`yyyy-MM-dd`). No fragile midnight alarm: a new date automatically means fresh usage and 3 new emergency sessions. Limits and settings are preserved. Works across reboots and timezone changes. |
| **Strict Mode** | Optional PIN (stored only as a salted PBKDF2 hash) gates limit edits, disabling protection, schedule/break changes and settings import. Optional editing cooldown (5/15/30 min) whose end-time is persisted so it can't be skipped by closing the app. Clear warnings before protection is weakened. |
| **Exempt apps** | Mark essential apps (calls, banking, work tools…) as exempt: measured, never blocked. The launcher, dialer/in-call UI, System UI, Settings, permission dialogs, emergency utilities, the keyboard and FocusLock itself are *always* exempt for safety. |
| **Protection schedule** | Enforce limits only during chosen hours (overnight windows supported). |
| **Break mode** | Manual breaks (15/30/60 min) and/or a daily scheduled break. Breaks never reset usage or emergency allowances. |
| **Statistics** | Today / Yesterday / Last 7 days / Last 30 days: total screen time, daily bar chart, per-app usage. Plus FocusLock's own *measured* numbers: blocked attempts (counted only when blocking actually happens), emergency sessions used, emergency time consumed, and a clearly-labelled "time protected" estimate. |
| **Anti-bypass health** | Detects revoked Usage Access / Accessibility and a stopped monitor service, warns on the Dashboard and via notification, and deep-links to the fix. Boot receiver restores protection after restart/update. |
| **Backup** | Export/import limits + settings as a JSON file you choose (Storage Access Framework). The PIN is never exported. No server involved — the app has **no internet permission at all**. |
| **UI** | Material Design 3, dynamic color on Android 12+, light/dark/system themes, bottom navigation (Dashboard, All Apps, Statistics, Emergency, Settings), readable type scale, content descriptions for accessibility. |

---

## How it works

```
UsageStatsManager ──► UsageTracker (resume/pause event pairing = accurate
│                      foreground time; daily buckets for 30-day history)
│
├─► AccessibilityService (window-change events only, cannot read content)
│         └─ instant foreground detection ─┐
└─► MonitorService (foreground service, 2 s poll, split-screen aware)
                                            ▼
                              ProtectionCoordinator
                (limits + schedule + break + emergency + exemptions)
                                            ▼
                                  BlockEngine (pure,
                                   unit-tested rules)
                                            ▼
                              BlockingActivity (full-screen)
```

- **Why both an accessibility service *and* a poller?** Usage statistics alone
  cannot block anything, and accessibility window events alone cannot notice
  an app that crosses its limit while already open (e.g. a 30-minute video at
  minute 29). Together they cover app launches *and* mid-session limits, and
  each still works if the other is disabled (degraded-mode warnings tell you).
- **Emergency timing:** `end = start + 10 min`, stored in Room. Remaining time
  is always `end − now`, so process death/reboot only ever *loses* time.
- **Daily reset:** date-keyed rows; nothing needs to "run at midnight".

### Project structure

```
app/src/main/java/com/focuslock/app/
├── FocusLockApp.kt                 Application + shared instances
├── data/                           Room DB, entities, DAOs, DataStore settings,
│                                   PIN manager, UsageTracker, apps repository
├── domain/                         BlockEngine (rules), EmergencyManager (3×10m),
│                                   ProtectionCoordinator (enforcement brain)
├── service/                        AccessibilityService, MonitorService,
│                                   BootReceiver, MaintenanceWorker, notifications
├── ui/                             MainActivity + 5 tabs, BlockingActivity,
│                                   permission setup, PIN/Strict-Mode dialogs
└── util/                           TimeUtils, PermissionUtils, BackupManager
app/src/test/                       JVM unit tests (emergency, blocking, schedule…)
app/src/androidTest/                Instrumented Room tests
```

---

## Permissions & privacy

| Permission | Why | Required? |
|---|---|---|
| Usage Access (`PACKAGE_USAGE_STATS`) | Measure per-app daily usage | **Required** |
| Accessibility Service | Know which app is in the foreground so limits can be enforced instantly. Configured with `canRetrieveWindowContent=false` — it **cannot** read text, passwords or screen content, and only receives window-change events (package names). | **Required** |
| Display over other apps (`SYSTEM_ALERT_WINDOW`) | Lets the blocking screen appear reliably over blocked apps | Recommended |
| Notifications (`POST_NOTIFICATIONS`) | Protection status + live emergency countdown | Recommended |
| Ignore battery optimization | Stops Android from sleeping FocusLock | Recommended |
| `QUERY_ALL_PACKAGES` | Core feature: list every installed app so each can have a limit | Required |
| `RECEIVE_BOOT_COMPLETED`, `FOREGROUND_SERVICE(_SPECIAL_USE)` | Restore/run protection | Required |

All data (limits, usage summaries, emergency counters, PIN hash) stays **on the
device**. FocusLock declares **no `INTERNET` permission**, collects no contacts,
SMS, location, microphone or screen content, and uploads nothing.

---

## Building the APK

Requirements for all methods: **JDK 17**, **Android SDK 34** (platform +
build-tools). The first build downloads Gradle 8.4 and the dependencies from
Google Maven / Maven Central, so it needs internet once.

### Option A — Android Studio (PC)

1. Open Android Studio → **Open** → select the `FocusLock` folder.
2. Wait for Gradle Sync to finish (accept any SDK component installs).
3. Run on a device/emulator: **Run ▶**.
4. Or build an APK: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
   Output: `app/build/outputs/apk/debug/app-debug.apk`.
5. For a signed release APK: **Build → Generate Signed App Bundle / APK** and
   create/select a keystore (keep it safe — updates must use the same key).

### Option B — Command line (PC)

```bash
cd FocusLock
./gradlew assembleDebug          # debug APK
./gradlew assembleRelease        # release APK (configure signing to install)
./gradlew installDebug           # build + install on a connected device
./gradlew testDebugUnitTest      # run JVM unit tests
./gradlew connectedDebugAndroidTest   # instrumented tests (device required)
```

### Option C — AndroidIDE (build entirely on your Android phone) 📱

AndroidIDE is a full Android IDE that runs on the phone itself — perfect for
this project, which is why FocusLock uses the classic Groovy Gradle DSL and
only Google/Maven-Central dependencies.

1. **Install AndroidIDE** from its official GitHub releases / F-Droid
   ("AndroidIDE" by AndroidIDEOfficial). On first launch let it install its
   toolchain (JDK 17 + Android SDK; needs some free storage and internet).
2. **Get the project on the phone**, e.g.:
   - Download this repository as ZIP (GitHub → *Code → Download ZIP*), extract
     it, or
   - Clone it with a git app / Termux: `git clone <repo-url>`.
3. **Open the project:** AndroidIDE → *Open Project* → choose the **`FocusLock`**
   folder (the one containing `settings.gradle`).
4. **Wait for the first Gradle sync** to finish — AndroidIDE downloads
   Gradle 8.4 and all library dependencies the first time (keep Wi-Fi on;
   this can take several minutes).
   - If `gradle/wrapper/gradle-wrapper.jar` is ever missing, open AndroidIDE's
     terminal in the project and run `gradle wrapper` once.
5. **Build the APK:** use the **Run ▶** action (hammer/run icon), or run
   `assembleDebug` from the Gradle actions panel / terminal:
   `./gradlew assembleDebug`.
6. **Install:** AndroidIDE can install directly (it will ask to enable
   *Install via USB / wireless debugging*, or use its built-in installer).
   Alternatively open the generated APK with any file manager:
   `FocusLock/app/build/outputs/apk/debug/app-debug.apk` → **Install**
   (allow "install unknown apps" for your file manager when prompted).
7. Launch **FocusLock** and complete the permission setup (below).

> Tip: building on-phone is slower the first time (dependency downloads +
> Kotlin compile). Later builds are incremental and much faster.

---

## First-run setup (important)

FocusLock explains each permission in-app before opening the relevant Android
Settings screen — you grant everything manually; nothing is enabled silently.

1. **Usage Access** → find *FocusLock* in the list → allow.
2. **Accessibility** → *Installed apps* → *FocusLock App Limiter* → enable and
   confirm Android's disclosure dialog.
   - *Android 13+ "Restricted setting"?* Open **Settings → Apps → FocusLock →
     ⋮ (top right) → Allow restricted settings**, then try again. (Android
     does this for apps installed from outside the Play Store.)
3. **Display over other apps** → allow FocusLock.
4. **Notifications** → allow (for the countdown).
5. **Battery** → exclude FocusLock from battery optimization.
6. **Xiaomi/Oppo/Vivo/Huawei/etc.:** also enable **Autostart** for FocusLock
   (the setup screen tries to open your vendor's autostart page) and set its
   battery mode to "No restrictions" if offered.

Then set your first limit in **All Apps**, e.g. Instagram → 30 minutes.

---

## Testing

### Automated tests

```bash
./gradlew testDebugUnitTest            # fast JVM tests, no device needed
./gradlew connectedDebugAndroidTest    # Room/instrumented tests on a device
```

The unit tests cover, among others: the exact 10-minute emergency duration,
4th-session denial, double-tap protection, single-active-session rule,
emergency persistence across a simulated reboot, midnight reset (including a
session that crosses midnight), limit-edit remaining-time maths, all
`BlockEngine` rules, schedule/break windows (incl. overnight), and date-key
behaviour.

### Manual test scenarios

| # | Scenario | Steps → expected result |
|---|---|---|
| 1 | Basic blocking | Set any app's limit to **5 minutes**, use it for 5 min → blocking screen appears with usage/limit/reset info. |
| 2 | Edit limit | With 25m used of a 30m limit, edit to **60m** → sheet previews "35m left"; app usable again. |
| 3 | Emergency session | On the blocking screen tap **Emergency Access → Start 10 minutes** → app opens, countdown notification shows 10:00 → after 10 min the app is blocked again (even mid-use). |
| 4 | Three-session cap | Use all 3 sessions → a 4th is refused: *"You have used all 3 emergency sessions for today."* |
| 5 | Reboot mid-session | Start a session, note the remaining time, reboot → remaining time is the same (minus boot time), session count unchanged. |
| 6 | Limit below usage | Use an app 25m, set its limit to **20m** → it blocks on next open (immediately if in use). |
| 7 | Midnight reset | After 00:00, usage counters and all 3 emergency sessions are fresh; limits unchanged. (Unit tests simulate this with a fake clock so you don't have to stay up.) |
| 8 | Permission revoked | Turn off Usage Access or the Accessibility service → Dashboard shows "Protection needs attention" and a warning notification appears. |
| 9 | Bypass attempts | Try opening a blocked app from a notification, Recents, split-screen or a home-screen shortcut → the blocking screen still appears. See *known limitations* below for the honest exceptions. |

---

## Known limitations & bypasses (honest list)

FocusLock is a **self-control tool for the device owner**, not a security
boundary. Like any normal (non-system) Android app it cannot make itself
impossible to remove:

- The device owner can **uninstall FocusLock**, **force-stop** it (this also
  disables its accessibility service until re-enabled — standard Android
  behaviour), revoke its permissions, boot into **Safe Mode**, or change the
  **device clock** (moving the date forward grants a new day's allowances).
  FocusLock *detects and warns* about degraded protection, but Android
  deliberately does not let an app prevent these owner actions. For
  tamper-resistant control (e.g. a child's phone), use Android's official
  **supervised/managed-device** options (Family Link or a device-owner MDM) —
  FocusLock does not pretend to replace them.
- **Settings, Phone (calls), launcher/home and emergency apps are never
  blocked** by design — you can always make calls and always reach Settings
  to manage the phone. (This also means Settings is a path to uninstall;
  see above.)
- **Picture-in-picture / freeform windows:** a video already playing in a
  small PiP window may keep playing until the app's main window is focused
  again; the monitor service's poll usually catches it within seconds via
  usage events, and expanding it is blocked.
- Some aggressive OEMs restrict background activity starts even with the
  overlay permission; FocusLock's fallback then sends the user to the Home
  screen and retries, so a blocked app is never usable for long, but the
  custom blocking screen may appear a moment later.
- Usage data comes from Android's `UsageStatsManager`; on a few OEM builds
  its numbers can lag by a few seconds.

## Reliability notes

- Limits/sessions are **date-based**, timers are **absolute timestamps**, the
  accessibility service is **re-bound by Android after boot**, the monitor
  service is `START_STICKY`, a **boot receiver** restores state (with a
  one-tap "resume" notification if Android 12+ refuses a background service
  start), and **WorkManager** periodically snapshots usage, prunes history
  and re-checks permission health. Protection therefore degrades gracefully
  instead of depending on any single always-running process.

## License

Provided as-is for personal/educational use. Developed by ronny raj
(funnypawan8@gmail.com).
