# Dream Classes

A responsive web-app prototype for **Dream Classes**, an Indian learning platform for school and competitive-exam students. It is built with plain HTML, CSS and JavaScript, so it runs without a build step or third-party runtime dependencies.

## Run locally

From the repository root, start a static server:

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open `http://localhost:4173`.

## Explore the app

- **Student workspace:** dashboard, courses, live-class schedule, DPP/test flow, study resources, doubt solving, community, progress and preferences.
- **Admin demo workspace:** overview metrics, student and faculty management, batches, content library, live-class scheduling, test management, doubt queue, notifications, payments, analytics and platform settings.
- Switch between the student and admin demo workspaces from the profile menu at the bottom of the sidebar.
- Local interactions include timed DPP scoring and XP, student status updates, draft batch/faculty/test creation, class scheduling, content metadata, doubt handling, notification history, bookmarks and dark mode. These are saved in the browser.

## Prototype boundaries

The role switch is for demonstration, not authentication. Sample records are illustrative. OTP/Google sign-in, real permissions, backend/database, video/live-class providers, actual media uploads/downloads, payment processing, push delivery and production analytics are not connected. Connect those services before using this as a production learning platform.
