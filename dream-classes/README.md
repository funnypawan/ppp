# 🎓 DREAM CLASSES — Complete Online Education Platform

**Teacher:** Dream Sir · **Address:** Kothwara, Dobhi, Gaya, Bihar, India
**Stack:** Node.js + Express + SQLite (built-in `node:sqlite`) + JWT + bcrypt · Student **PWA** (installable on Android) + responsive **Teacher/Admin Panel** · One shared backend & database.

## 🚀 Run it (5 minutes)
```bash
cd dream-classes
npm install
ADMIN_PASSWORD='YourStrongPassword' node seed.js   # creates Super Admin + Class 9–12 structure
npm start                                            # http://localhost:3000
npm test                                             # 56 end-to-end tests (2 suites)
```
- **Student App:** `/` — login with mobile OTP (in dev mode the OTP is shown on screen for testing)
- **Teacher Panel:** `/admin` — default login `admin@dreamclasses.in` / password set at seed (default `Dream@12345` — **change it**)

## ✅ What's implemented & working
- **Auth:** Mobile OTP (hashed, 5-min expiry, 5-attempt + rate limits), admin email/password (bcrypt), roles `SUPER_ADMIN / TEACHER / STUDENT`, **manual or auto approval** (Admin → Settings), **single-device sessions** with revocation, audit logs.
- **Student app:** Home dashboard (progress, announcements, continue-learning, **upcoming tests, subject-wise performance**, results), My Classes (Class → Subject → Chapter from DB), **video player** (speeds 0.5–2x, resume, prev/next, fullscreen, **moving personal watermark**, 5-minute signed playback URLs, byte-range streaming, **quality selector 240p/360p/720p when variants are registered, HLS (.m3u8) adaptive playback**), **PDF.js reader** (page navigation, zoom, auto resume-page saving, no text selection, on-screen watermark; **downloads are stamped with the student's name + masked mobile on every page**), **practice questions** per chapter with instant server-checked feedback, **MCQ tests** (timer + auto-submit, mark-for-review, question palette, **server-side scoring**, negative marking, duplicate-submit protection, answers hidden until permitted review), **doubts** with photo upload & follow-ups (teacher can attach image/PDF solutions), **offline downloads** (permitted lectures/notes stored in app-private IndexedDB with a My Downloads section), **Web Push notifications** (VAPID — real phone alerts, no Firebase needed) + in-app inbox, profile (photo, theme light/dark/system, install app, delete account), Privacy/Terms/Help drafts.
- **Admin panel:** Real dashboard counts + **7-day activity chart**, student approve/reject/block/unblock/transfer/revoke-device + per-student progress + class/batch filters, class/subject/chapter CRUD with publish & ordering, batches, **video upload with progress + drag-drop** (or URL/YouTube/HLS) with **thumbnail + quality-URL registration and full edit forms**, **multi-PDF upload** with edit forms, test creator (questions, marks, explanations, states DRAFT/SCHEDULED/PUBLISHED/CLOSED, **open/close scheduling**, CSV export), **practice-question manager**, doubt answering with image/PDF attachments, notification center (all/batch/class/student + preview + **scheduled sending with auto-dispatch** + history with status), announcements, teacher management, **admin password change, one-click database backup download**.
- **Security:** Backend-enforced roles & batch access on every content/test/file request, blocked-student enforcement, upload type/size validation, no secrets in frontend, files never stored in DB rows.
- **PWA:** manifest + service worker — students install it like an app from Chrome ("Add to Home screen").

## 📱 Android APK (Capacitor)
No Android SDK exists in this sandbox, so no APK was built here. On a PC with Android Studio:
```bash
npm i -g @capacitor/cli && npm i @capacitor/core @capacitor/android
cp android-capacitor/capacitor.config.json .   # set server.url to your deployed HTTPS domain
npx cap add android && npx cap sync && npx cap open android
# Android Studio → Build → Generate Signed App Bundle/APK (create keystore, keep it safe)
```
Package name: `in.dreamclasses.app`. For screenshot blocking in the APK add `FLAG_SECURE` in `MainActivity` (documented in `android-capacitor/NOTES.md`).

## 🔌 Production integrations still needed (credentials only — code hooks ready)
1. **SMS/WhatsApp OTP:** signup at MSG91/Twilio/WhatsApp Business API, set `OTP_MODE=production` + keys in `.env`, enable sender in `server.js` (`/api/auth/request-otp`).
2. **Push notifications:** ✅ **Web Push (VAPID) is implemented and works out of the box** for the PWA/Android Chrome (keys auto-generated & stored server-side; students tap “Enable Push Notifications”). FCM is only needed later if you ship the native Capacitor APK and want native push there.
3. **Deploy:** any Node host (Render/Railway/VPS): set env vars from `.env.example`, `npm install && node seed.js && npm start`, put HTTPS (Caddy/Nginx) in front, back up `data/dream.db` + `uploads/` daily. For many/large videos, move `uploads/` to S3/R2 and store URLs.

## ⚠️ Honest limitations
- Web/PWA cannot fully block screenshots/screen-recording or another camera photographing the screen; watermark + signed URLs + single-device login are the practical web protections (native FLAG_SECURE is available in the Capacitor APK).
- Offline downloads in the PWA use browser IndexedDB (app-private, not in the phone gallery) — subject to browser storage quotas/eviction; the native APK can use true private storage. Encrypted downloads cannot make copying impossible.
- Automatic video transcoding (generating 240p/360p/720p from one upload) needs `ffmpeg` on the server (not available in this sandbox). Until then, register per-quality URLs from your video host/CDN in the video form, or publish an HLS (.m3u8) adaptive stream — the player handles both. On a server with ffmpeg installed, add a transcode job after upload to fill `videos.qualities` automatically.
- Privacy Policy/Terms are drafts — finalise with your actual providers before public launch.
