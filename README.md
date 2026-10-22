# Dream Classes

A responsive web MVP for **Dream Classes**, an Indian learning platform for school and competitive-exam students. It includes student and admin workspaces, a small Node.js API and local JSON persistence. There are no third-party runtime dependencies.

## Run locally

Requires Node.js 18 or later. From the repository root:

```bash
npm start
```

Open `http://localhost:4173`. The first run creates `data/store.json`; local data files are intentionally ignored by Git.

## Demo sign-in

Choose **Student** or **Admin**, enter a 10-digit test number, then use the one-time code displayed in the app after the request. No SMS is sent; use a demo number rather than a personal number. The app uses a signed, HTTP-only session cookie; the development OTP flow and role selection are for local demo use only, not production authentication.

## What’s included

- **Student workspace:** dashboard, courses, live-class schedule, timed DPP/test flow, study resources, doubt solving, community, progress and preferences.
- **Admin workspace:** overview, student/faculty management, batches, content metadata, class scheduling, test management, doubt queue, notifications, analytics and settings.
- Student/admin role-protected API routes, development OTP sign-in, and server-side persistence for student records, batches, faculty, scheduled classes, tests, content metadata, doubts, community posts and notification history.
- Local interactions include DPP scoring/XP, bookmarks, reminders, progress display and appearance preferences.

Switch workspaces from the profile menu at the bottom of the sidebar. Switching roles returns to the sign-in screen so the demo session role stays consistent with the server.

## Intentionally skipped / production work

**Payments are intentionally skipped.** This MVP also does not send real OTPs, provide Google OAuth, store uploaded media, stream live video, deliver push notifications or connect PostgreSQL/Redis. Content upload currently saves metadata only. Before production, configure real identity and SMS providers, secure secrets, a production database, object storage, video/live-class services and operational monitoring. The included sample records are illustrative.
