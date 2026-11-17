# Permission Setup Guide — FOCUS LIFE

FOCUS LIFE is **offline-first and private**. It never uploads data, never collects private content, and never secretly monitors you. Each permission below explains exactly why it is needed and how to revoke it.

## 1. Notifications (Android 13+)

- **Why:** Routine reminders, revision reminders, focus-session completion.
- **How:** Open app → tap **Allow** on the system prompt. Or Settings → Apps → FOCUS LIFE → Notifications → ON.
- **Revoke:** Same screen → OFF. App still works; reminders stop.

## 2. Usage Access (for Mobile Usage Analyzer)

- **Why:** `UsageStatsManager` to show your daily screen time and app-wise usage (foreground time + launch count). This is the **only** way Android exposes screen time. Data stays on your phone.
- **How:** Focus tab → **Usage Access** button → find **FOCUS LIFE** → toggle **Allow usage access** → Back → tap **Refresh** (reopen Focus tab).
- **Verify:** Focus tab shows "Total Screen Time Today" with app list.
- **Revoke:** Settings → Apps → Special app access → Usage access → FOCUS LIFE → OFF. Analyzer shows a friendly empty state; rest of app unaffected.
- **Privacy:** We read only aggregate foreground time per app. We do NOT read messages, photos, or content.

## 3. Accessibility (for App Blocker warning)

- **Why:** To show a warning screen *before* you open an app you selected as distracting while a Focus/Study/Running/Sleep mode is active. It does NOT read screen content (`canRetrieveWindowContent=false`), does NOT record keystrokes, and does NOT send data anywhere.
- **How:** Focus tab → **Accessibility Settings** → find **FOCUS LIFE** → toggle **ON** → confirm. Then select blocked apps (YouTube, Instagram, etc.) and start a Focus mode.
- **Test:** Start Deep Focus (25 min) → open YouTube → FOCUS LIFE warning appears → tap **Go Back** or **Emergency Unlock** (with reason).
- **Revoke:** Settings → Accessibility → FOCUS LIFE → OFF. Blocker stops; timer/study/habits keep working.
- **Play Store note:** Accessibility use is disclosed in the Play Data Safety form as "App functionality — distraction warning, on-device only."

## 4. Routine reminders (no extra permission needed)

- **Why:** To remind you at your routine times (e.g. 05:00 Running).
- **How it works:** WorkManager checks every 15 minutes and notifies when a slot is approaching. No exact-alarm permission is required or requested.
- **Control:** Profile tab → the "Routine reminders" toggle disables them entirely (the background worker checks this flag before doing anything).
- **Battery:** On OPPO/Xiaomi/Vivo the 15-minute cadence may be batched by the OS. See section 5.

## 5. Battery Optimization (recommended for timer)

- **Why:** On OPPO/Xiaomi/Vivo, the OS may kill the foreground timer in background.
- **How:** Settings → Battery → Battery optimization → FOCUS LIFE → **Don't optimize**. This keeps the 25/50-min timer accurate.
- **Revoke:** Not required; "Don't optimize" only affects FOCUS LIFE.

## 6. In-app Permissions screen

Open **Profile → Permissions** to see a live ✓/✗ status for Notifications, Usage Access and Accessibility, with one-tap Grant/Fix buttons and a **Re-check Permissions** button after you return from Settings. This screen reads the real runtime state (not just what the user tapped earlier).

## 7. Graceful denial

Every feature degrades gracefully: deny Usage Access → analyzer shows instructions; deny Accessibility → blocker is disabled but timer works; deny Notifications → no reminders but all tracking works. No crashes, no forced prompts.
