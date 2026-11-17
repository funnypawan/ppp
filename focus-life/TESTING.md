# Feature Testing Report — FOCUS LIFE v1.0.0

**Date:** 2026-11-17 | **Target device:** OPPO A18 (4GB RAM, Helio G85), Android 10+ | **Build:** Debug APK via GitHub Actions (AGP 8.5.2, JDK 17)

## Automated tests (CI)

- `./gradlew testDebugUnitTest` — unit tests for `UsageHelper.formatDuration`, `Quotes.dailyQuote`, `UsageHelper.suggestions` (see `ExampleUnitTest.kt`). **Status:** PASS in CI (GitHub Actions).
- `./gradlew assembleDebug` — full compilation + APK packaging. **Status:** PASS in CI; APK verified with `aapt2 dump badging` (package `in.focuslife.app`, label `FOCUS LIFE`, launchable `MainActivity`).
- `./gradlew lintDebug` — Android lint. **Status:** PASS (no errors; warnings only for non-critical items).

## Manual / on-device verification checklist

> Run on a physical Android 10+ device (OPPO A18 or similar). Mark ✅ after testing.

| # | Feature | Steps | Expected | Status |
|---|---------|-------|----------|--------|
| 1 | Dashboard | Open app → Home | Progress circle, Focus Score, tasks, study/focus/screen time, streak, running, goals, quote visible | ☐ |
| 2 | Deep Focus timer | Focus → 25 min → Start | Foreground notification, countdown, pause/resume/stop work; session saved to history | ☐ |
| 3 | Study planner | Study → Add target → check it | Task appears, counts update; weekly stats update | ☐ |
| 4 | Habit tracker | Habits → check 3 habits | % updates, streak updates, weekly calendar fills | ☐ |
| 5 | Fitness | Profile → Fitness → Save log | Home running/exercise cards update; weekly progress shows | ☐ |
| 6 | Routine | Profile → Routine → edit time/title → Save | Slot updates; reminder fires near slot time | ☐ |
| 7 | Usage analyzer | Grant Usage Access → Focus tab | Total screen time + app list + launch counts + suggestions | ☐ |
| 8 | App blocker | Grant Accessibility → select YouTube → Start Focus → open YouTube | Warning overlay appears; Go Back returns; Emergency Unlock logs reason | ☐ |
| 9 | Control Yourself | Profile → Control → add diary entry + reasons | Entry appears in diary; reasons shown on blocker overlay | ☐ |
| 10 | Motivation | Profile → Motivation → add goal + vision | Goals/vision appear; daily quote shows | ☐ |
| 11 | Daily report | Profile → Report | Study/focus/running/habits/goals + improvement area + weekly table | ☐ |
| 12 | Language | Profile → हिन्दी | UI labels switch to Hindi; text remains readable | ☐ |
| 13 | Permission denial | Deny Usage/Accessibility/Notifications | App does not crash; friendly empty states shown | ☐ |
| 14 | Offline | Airplane mode → use all tabs | All features work; no network errors | ☐ |
| 15 | Battery | Run 25-min timer with screen off | Timer completes; notification + history saved | ☐ |

## Known limitations (honest)

- App blocking uses Accessibility to show a **warning overlay** (not a hard system lock) — this is the Android-supported approach; users can still emergency-unlock. A hard lock is not possible without Device Owner / root.
- Usage "app openings" uses `mLaunchCount` from UsageStats (available on most devices; may be 0 on some OEMs).
- Exact routine alarms use WorkManager (15-min) + AlarmManager fallback; exact timing may vary by ±few minutes on aggressive OEM battery savers (OPPO/Xiaomi). Disable battery optimization for best results.
- On-device tests (rows 1–15) must be run on a physical device; they cannot be fully automated in CI. This report does not claim they were run if not marked ✅.

## Compilation & APK

- **APK:** `FocusLife-v1.0-debug.apk` (debug build, ~8–12 MB) — installable on any Android 10+ device.
- **Source:** Complete Android Studio project in `focus-life/`. Open in Android Studio and Run ▶ to debug.
