# Optional online assistant backend

The Android app works completely offline. **You do not need this server** for
any reminder, sound, notification, Hindi voice message or saved routine.

This small server exists for one reason only:

> An API key must never be shipped inside an APK. Anyone can unzip an APK and
> read it. So the app stores *no key at all* — it only stores the URL of a
> server that you control, and that server is where the key lives.

## What it does

```
POST /assist
{
  "message": "I feel tired today",
  "name": "Ronny",
  "language": "hi-IN",
  "context": { "total": 13, "done": 4, "schedule": ["Running 05:00", ...] }
}
-> 200 { "reply": "Ronny, thoda aaram kijiye phir ek chhota kaam shuru kijiye." }
```

* `GET /health` returns `{"ok": true, "provider": "..."}`.
* If no provider key is configured the server replies from its own offline
  Hindi motivation bank — the same fallback the app uses.
* Nothing is logged, nothing is stored.

## Run it

```bash
cd backend
export ANTHROPIC_API_KEY=sk-...          # or OPENAI_API_KEY=sk-...
export RONNY_ASSIST_TOKEN=some-long-random-string
python3 server.py                        # http://0.0.0.0:8787
```

No pip packages are required — it uses only the Python standard library.

## Point the app at it

1. Put the machine on the same network as the phone (or expose it over HTTPS
   with a real certificate — Android blocks plain HTTP for apps that target
   recent SDKs unless you allow cleartext for your own host).
2. In the app: **Settings → AI assistant → enable**, then set
   **Assistant server URL** to `https://your-host/assist`.

## Security notes

* Keep `server.py` behind HTTPS in production.
* Use a long random `RONNY_ASSIST_TOKEN`; the app can send it via the
  `X-Ronny-Token` header.
* Rate-limit `/assist` if you expose it publicly.
* The app reads the routine **read-only** for personalisation. Nothing in the
  app ever lets the AI change, add or delete a scheduled activity.
