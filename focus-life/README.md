# FOCUS LIFE — Personal Discipline & Distraction Control

**Package:** `in.focuslife.app` | **Android 10+ (API 29+)** | **Offline-first** | **No ads, no paid APIs, no tracking**

FOCUS LIFE helps you overcome digital distractions, reduce unnecessary mobile usage, improve concentration, develop discipline, maintain daily routines and achieve personal goals — built for Railway ALP / Group D / SSC CGL / SSC GD aspirants.

## Features (all functional, local-only)

1. **Main Dashboard** — Today's Focus Score (0–100), completed tasks, study time, focus time, screen time, daily streak, running/exercise progress, remaining goals, motivational message, daily progress circle.
2. **App Blocker System** — Select distracting apps (YouTube, Instagram, Facebook, Free Fire, games, etc.), daily usage limits, modes (Study / Running / Sleep / Deep Focus), emergency unlock, warning overlay before opening blocked apps. Uses **Usage Access + Accessibility APIs only**, transparently, with no secret monitoring.
3. **Deep Focus Mode** — 25-min/5-min, 50-min/10-min, custom timer, full-screen timer UI, pause/resume, session history, current task + remaining time, distraction warning during sessions.
4. **Daily Study Planner** — Exams (Railway ALP, Group D, SSC CGL, SSC GD), subjects (Maths, Reasoning, Biology, Physics, Chemistry, GK), daily targets, chapter-wise goals, completed topics, study timer (via Focus), revision reminders, daily/weekly reports.
5. **Running & Fitness Tracker** — Daily running target, duration, distance, exercise checklist, pull-up tracking, weekly progress, rest-day management, workout reminders, optional 1600m goal with time recording.
6. **Habit Tracker** — 10 default habits (wake up on time, exercise, running, Maths/Biology/Reasoning, avoid mobile/gaming, read, sleep on time), daily checklist, completion %, weekly calendar, streak, progress charts, missed-habit analysis. No shaming.
7. **Mobile Usage Analyzer** — Total daily screen time, app-wise usage, most-used apps, app openings (launch count), weekly comparison, daily limit, practical suggestions. Uses `UsageStatsManager` with user permission.
8. **CONTROL YOURSELF** — Distraction diary, triggers, personal reasons, 5-minute alternatives, emergency focus button, 4-step reset (put phone away → drink water → short walk → return to task).
9. **Daily Routine System** — Editable schedule (default 04:30 wake → 20:30 sleep prep), modify every slot, notifications for upcoming activities.
10. **Motivation** — Daily quotes (EN/HI), personal goals, vision board, discipline reminders, milestones.
11. **Daily & Weekly Reports** — Study time, mobile usage, focus sessions, running, habits, goals, areas for improvement.
12. **Design** — Premium dark navy theme, progress circles, charts, bottom nav (Home/Focus/Study/Habits/Profile), large readable Hindi text, EN/HI support.

## Architecture

```
focus-life/
  app/src/main/java/in/focuslife/app/
    data/        Room DB, Repository, Preferences (DataStore), UsageHelper, Quotes
    service/     FocusTimerService (foreground), BlockerAccessibilityService, BlockerOverlayActivity,
                 ReminderWorker (WorkManager), BootReceiver, NotificationHelper
    ui/          Compose Material3 screens + AppViewModel
```

- **Storage:** Room (`focuslife.db`) + DataStore. 100% offline. No network calls.
- **Background:** Foreground service for timer (wake lock), WorkManager periodic reminders (15 min), battery-efficient.
- **Permissions:** POST_NOTIFICATIONS, FOREGROUND_SERVICE, PACKAGE_USAGE_STATS, SCHEDULE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED. Accessibility only for blocker warning.
- **Target:** OPPO A18 (4GB RAM, Helio G85), Android 10+. Lightweight, no heavy libraries.

## Build

See [INSTALL.md](INSTALL.md) and [PERMISSIONS.md](PERMISSIONS.md). APK is built via GitHub Actions (cloud) — no local Android Studio needed. See `.github/workflows/build-focus-life-apk.yml`.

## Testing

See [TESTING.md](TESTING.md) for the feature testing report. Unit tests run in CI; on-device blocker/usage tests require a physical device (steps included).
