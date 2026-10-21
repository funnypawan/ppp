# Dream Classes

A two-app Android ecosystem for **Dream Classes**, Kothwara, Dobhi, Gaya, Bihar. The Teacher and Student apps have separate application IDs but consume one secure API and database.

## What is implemented in this foundation

- Android multi-module project: `teacherApp`, `studentApp`, and shared API models (`shared`)
- Separate IDs: `in.dreamclasses.teacher` and `in.dreamclasses.student`
- Node/TypeScript shared backend with PostgreSQL and private S3-compatible storage
- Password login with Argon2 verification and short-lived signed JWTs
- Server-enforced teacher authorization; no teacher registration route
- PDF upload presigning with MIME/size validation
- PDF create, edit, publish/unpublish (via edit), soft delete, student listing, entitlement checks and signed downloads
- Drafts never appear in student listings; course enrollment, expiry and paid purchase access are checked server-side
- Initial financial/audit-oriented schema

The Android home screens establish the brand/navigation shell. The full video, live, exam, assignment, notification, recovery/2FA, payment-webhook, offline-download UI and production provider integrations listed in the product brief are **roadmap work, not claimed as complete**. APKs are not checked into source control and cannot be produced in this environment because an Android SDK/JDK is unavailable.

## Backend setup

Requirements: Node 22, PostgreSQL 16, and a private S3-compatible bucket.

```bash
cd backend
cp .env.example .env                 # replace every placeholder
psql "$DATABASE_URL" -f migrations/001_core.sql
npm ci
npm run check
npm start
```

Provision the first teacher only from a trusted administrative process. Generate an Argon2id hash and insert a lowercase email with `role='teacher'`; never add this capability to a public client. Put the API behind HTTPS and an API gateway/WAF with rate limits. Keep `.env`, DB credentials, storage keys, payment secrets, and signing keys in a cloud secret manager.

Object storage must be private. Clients receive short-lived PUT/GET URLs; bucket public access must remain disabled. In production, verify the uploaded object's actual size and magic bytes asynchronously before allowing publication.

## Android build

Install JDK 17 and Android SDK 35, then add the standard Gradle wrapper (or open in Android Studio) and configure the API endpoint outside source control:

```bash
./gradlew -PDREAM_API_URL=https://api.dreamclasses.example/ \
  :teacherApp:assembleRelease :studentApp:assembleRelease
```

Release signing belongs in CI secret storage. Never commit keystores or `google-services.json`. Outputs have distinct APKs under each app's build directory.

## Critical synchronization flow

1. Teacher requests `/v1/uploads`; backend role-checks and returns a temporary upload URL.
2. Teacher uploads directly to private storage and creates `/v1/materials` with the stable storage key.
3. Student requests `/v1/materials`; SQL only returns published, non-deleted, non-expired and course-authorized rows.
4. Title/status changes increment `version` and are immediately reflected on subsequent reads.
5. Downloads are separately authorized and logged; URLs expire after five minutes.
6. Paid access requires a server-side `purchases.status='paid'` row. A client success screen cannot create access.

## Production checklist

Before release: add refresh-token rotation/revocation, verified password recovery and optional TOTP; payment order/webhook/refund handlers with provider signature verification; malware scanning; videos/live/exams/assignments; FCM; privacy/consent and retention policies; backups/PITR; audit triggers; integration tests against disposable Postgres/S3; accessibility and offline encrypted file handling. Test unauthorized teacher APIs, IDOR, draft leakage, enrollment, expiry, payment replay, signed URL expiry, deletion retention, and complete upload-to-student behavior with dedicated test accounts.
