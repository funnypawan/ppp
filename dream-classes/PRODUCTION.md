# 🚀 Dream Classes — Production Runbook

## 1. Server setup (any Node 18+ host / VPS)
```bash
git clone <repo> && cd dream-classes
cp .env.example .env      # fill real values (see below), chmod 600 .env
npm install --omit=dev
set -a; . ./.env; set +a   # load env (or use your process manager's env file)
node seed.js               # first run only: creates Super Admin + base structure
npm start                  # or: pm2 start server.js --name dream-classes
```
Server prints ⚠️ CONFIG warnings at startup for anything not production-ready.
The same warnings appear in **Admin → Settings**.

## 2. HTTPS (required for PWA install, Web Push, camera)
Put the app behind a reverse proxy with a free Let's Encrypt certificate:
- **Caddy** (simplest): `yourdomain.in { reverse_proxy localhost:3000 }`
- Or Nginx + Certbot. Set `TRUST_PROXY=1` so rate-limiting/HTTPS detection work.

## 3. Authentication / OTP provider
- Dev mode shows OTP on screen (testing only; server warns).
- Production: create an **MSG91** account → approve a DLT SMS template → set
  `OTP_MODE=production`, `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID` in `.env`, restart.
  The server calls MSG91's SendOTP API; without keys it returns an honest
  "OTP service is not configured" error instead of pretending to send.
- WhatsApp OTP needs a WhatsApp Business API provider (MSG91/Twilio) — same keys pattern.

## 4. Database
- SQLite file `data/dream.db` (zero-config). Back it up daily:
  Admin → Settings → **Download Backup**, or cron-copy `data/` + `uploads/`.
- Large scale later: migrate to Postgres (schema in `db.js` maps 1:1 to tables).

## 5. File & video storage
- Uploads live in `uploads/` (videos/pdfs/images/thumbs). Videos/PDFs/private images
  are served ONLY through authenticated API routes — never as public static files.
- For big video libraries use a CDN/video host: paste direct MP4/HLS (.m3u8) URLs
  (and 240p/360p/720p variants) in the Video form instead of uploading.
- Optional auto-transcoding: install `ffmpeg` on the server and add a post-upload
  job filling `videos.qualities` (see README limitations).

## 6. Push notifications
- **Web Push works out of the box** (VAPID keys auto-generated into the DB).
  Requires HTTPS. Students tap *Enable Push Notifications* once per device.
- FCM is only for a future fully-native build (see `.env.example` optional var).

## 7. Go-live checklist
- [ ] `.env` filled; `JWT_SECRET` random; default admin password changed
- [ ] HTTPS active; Admin → Settings shows **no warnings**
- [ ] OTP_MODE=production with provider keys (test one real OTP)
- [ ] Approval mode chosen (Settings); test student registration end-to-end
- [ ] Backups scheduled (DB + uploads); `npm test` green (76 tests)
- [ ] Privacy Policy/Terms drafts reviewed & finalised for your providers
