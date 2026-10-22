# 🚀 Dream Classes — Production Runbook

यह guide real students के लिए app चलाने की है। **Student app अब owner के निर्देश पर
name-only login इस्तेमाल करता है**: student से mobile number, SMS या OTP नहीं
माँगा जाता (`STUDENT_AUTH_MODE=name`, यही default है)। Demo OTP production में
बंद है; नीचे दिया SMS OTP section सिर्फ optional legacy mode के लिए है।

## 1. Server setup

```bash
cd dream-classes
npm ci
# Host/Render की Environment settings में .env.example वाले variables भरें
node seed.js   # पहला Super Admin + editable starter structure (सिर्फ एक बार)
npm start
```

- Student App: `/`
- Teacher Panel: `/admin`
- Health: `/api/health` → `{ ok: true, app: "Dream Classes" }`
- Server startup और **Teacher Panel → Settings** में configuration warnings दिखती हैं।

## 2. Database और uploads को permanent रखना

Default paths:

- Database: `data/dream.db`
- Uploads: `uploads/`

Render free/ephemeral disk पर ये restart/redeploy पर मिट सकते हैं। Real use के लिए:

1. Render service को paid instance पर लें।
2. Persistent Disk जोड़ें और **Mount Path = `/var/data`** रखें।
3. Environment में set करें:

   ```text
   STORAGE_DIR=/var/data/dream-classes
   ```

4. Redeploy करें। अब database `STORAGE_DIR/data` और uploads `STORAGE_DIR/uploads`
   में रहेंगे। अलग paths चाहिए हों तो `DATA_DIR` और `UPLOADS_DIR` इस्तेमाल करें।
5. Teacher Panel → Settings से समय-समय पर database backup download करें और uploads
   का भी backup रखें।

पहले से app folder में database हो और नया `DATA_DIR` खाली हो, तो startup पर पुरानी
database एक बार नए folder में copy हो जाती है। Uploads के लिए पुरानी files नए
`UPLOADS_DIR` में copy करना ज़रूरी हो सकता है; तब तक server पुरानी location से
fallback करके file खोजता है।

## 3. पहला Teacher account बनाना

कोई public/default password नहीं है।

### तरीका A — Render environment से (recommended)

```text
ADMIN_EMAIL=admin@dreamclasses.in
ADMIN_PASSWORD=<12+ characters का strong password>
```

फिर redeploy करें। Start command `node seed.js && node server.js` पहला Super Admin
बनाएगा। बाद में केवल `ADMIN_PASSWORD` बदलने से पुराना password खुद नहीं बदलेगा—
यह सुरक्षा के लिए है।

### तरीका B — Protected first-time setup form

अगर कोई Super Admin नहीं है और server पर 24+ characters का
`ADMIN_SETUP_TOKEN` set है, तो `/admin` पर first-time setup form दिखेगा।
Token सिर्फ server owner को पता होना चाहिए।

### Password भूल जाएँ / “Invalid email or password” आए तो

1. Render → service → Environment में `ADMIN_EMAIL` वही रखें।
2. `ADMIN_PASSWORD` में नया strong password (12+) डालें।
3. एक और variable जोड़ें: `ADMIN_PASSWORD_RESET=1`
4. Redeploy करें और नए password से login करें।
5. Login सफल होते ही `ADMIN_PASSWORD_RESET` हटा दें।

Reset से पुराने teacher sessions भी revoke हो जाते हैं।

## 4. Student login: नाम-only (default) और optional legacy SMS OTP

Current student app के लिए कोई SMS setup नहीं करना है:

```text
STUDENT_AUTH_MODE=name
```

Student अपना पूरा नाम डालता है; पहली बार account बनता है और Manual approval
mode में वह PENDING रहता है। Teacher Panel से approve/batch assign करने के बाद
ही lectures, notes और tests खुलते हैं। हर student को हर बार बिल्कुल वही पूरा
नाम डालना है। समान नाम वाले छात्रों के लिए teacher को नाम में अलग पहचान रखनी
चाहिए (जैसे पूरा नाम के साथ पिता का नाम/गाँव), क्योंकि नाम ही login पहचान है।

### Legacy SMS OTP फिर से चालू करना हो तभी

Code दो India OTP providers support करता है। यह mode सिर्फ तब चलेगा जब आप
खुद `STUDENT_AUTH_MODE=otp` set करेंगे; student app की current screen OTP नहीं
माँगती। Credentials **केवल backend/Render Environment** में रहेंगे—APK या
frontend में कभी नहीं।

### Option 1 — MSG91 (existing setup के लिए recommended)

MSG91 account में KYC/onboarding पूरा करके OTP template तैयार करें। India SMS के
लिए MSG91 आपसे DLT principal entity, approved header/sender ID और approved content
template माँग सकता है। MSG91 panel से OTP template ID लें, फिर Render में set करें:

```text
OTP_MODE=production
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=<secret>
MSG91_TEMPLATE_ID=<approved OTP template id>
```

अगर MSG91 auth key पर IP security/whitelist on हो, तो Render server के outbound
access के लिए MSG91 support/panel settings में उसे ठीक करना होगा।

### Option 2 — 2Factor

```text
OTP_MODE=production
SMS_PROVIDER=2factor
TWOFACTOR_API_KEY=<secret>
TWOFACTOR_TEMPLATE_NAME=<optional template name>
```

`SMS_PROVIDER` खाली छोड़ने पर server उपलब्ध credentials से provider auto-detect
करता है। Provider HTTP 200 के साथ error body दे, तो भी app उसे success नहीं मानता।
SMS fail होने पर OTP challenge `SEND_FAILED` हो जाता है और verify नहीं होता।

> जब तक आप अपने provider account से एक असली test OTP सफलतापूर्वक न भेज लें,
> SMS को “working” न मानें। Automated tests mocked provider इस्तेमाल करते हैं और
> कोई real SMS credit खर्च नहीं करते।

### OTP सुरक्षा

- 6-digit OTP cryptographic random से बनता है।
- OTP hash होकर store होता है; plaintext database/log में नहीं जाता।
- Default validity 10 minutes, resend cooldown 60 seconds।
- Per-mobile और per-IP hourly limits, अधिकतम 5 wrong attempts।
- नया OTP पुराने को supersede करता है; सही OTP सिर्फ एक बार चलता है।
- नए student का नाम न भरा हो तो OTP consume नहीं होता—वही OTP नाम भरकर फिर
  verify किया जा सकता है।
- Manual approval mode में नया student PENDING रहता है और content नहीं देख सकता।

## 5. HTTPS और CORS

- Render का HTTPS URL ही Android app में डालें। GitHub repository URL न डालें।
- App server address save करने से पहले `/api/health` check करता है।
- Capacitor origins (`https://localhost`, `capacitor://localhost`) code में built-in हैं।
  अलग web domain हो तो `ALLOWED_ORIGINS` में जोड़ें।
- `TRUST_PROXY=1` Render/reverse proxy के पीछे रखें।

## 6. Go-live checklist

- [ ] `JWT_SECRET` random और secret है
- [ ] Teacher account strong password से login होता है
- [ ] `ADMIN_PASSWORD_RESET` हटाया गया है
- [ ] Persistent disk + `STORAGE_DIR` set है
- [ ] एक redeploy के बाद student/teacher/content data बना रहता है
- [ ] `STUDENT_AUTH_MODE=name` है और student सिर्फ नाम डालकर login/register कर पाता है
- [ ] (सिर्फ legacy OTP mode चुनें तभी) एक SMS provider configured है और असली mobile पर OTP test सफल है
- [ ] Teacher Panel → Settings में serious warnings नहीं हैं
- [ ] Student registration → pending → teacher approval → content flow test हुआ है
- [ ] PDF/video upload करके approved student से open test हुआ है
- [ ] Database + uploads backup की व्यवस्था है
- [ ] `npm test` green है

## 7. Tests

```bash
npm test
```

Tests isolated temporary database/uploads इस्तेमाल करते हैं। इसलिए वे आपकी real
`data/` या `uploads/` को नहीं बदलते। Local test OTP सिर्फ `NODE_ENV=test` +
`ALLOW_DEV_OTP=1` में API response में मिलता है; student UI उसे कभी प्रदर्शित नहीं
करती और production उसे हमेशा ignore करता है।
