#!/usr/bin/env python3
"""
Tiny backend for the OPTIONAL online motivational assistant.

Why this exists
---------------
The Android app must never contain an AI provider API key: anything shipped in
an APK can be extracted. So the app only knows the URL of *your* server, and
this server is the one place that holds the secret key.

Contract
--------
POST /assist      {"message": "...", "name": "Ronny", "language": "hi-IN",
                   "context": {"total": 13, "done": 4, "schedule": [...]}}
  -> 200 {"reply": "short Hindi motivational sentence"}

Everything else returns 404. The server keeps no logs of Ronny's messages.

Running it
----------
    export ANTHROPIC_API_KEY=sk-...        # or OPENAI_API_KEY
    export RONNY_ASSIST_TOKEN=some-secret  # shared secret checked by the server
    python3 backend/server.py              # listens on 0.0.0.0:8787

Then in the app: Settings -> AI assistant -> enable, and set the server URL to
    http://<your-machine>:8787/assist

Without a provider key the server simply falls back to its own offline Hindi
motivation bank, which is exactly the same fallback the app uses.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8787"))
TOKEN = os.environ.get("RONNY_ASSIST_TOKEN", "")
PROVIDER_KEY = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("OPENAI_API_KEY")
PROVIDER = "anthropic" if os.environ.get("ANTHROPIC_API_KEY") else (
    "openai" if os.environ.get("OPENAI_API_KEY") else "offline")

SYSTEM_PROMPT = (
    "You are Ronny's personal routine assistant. Ronny is a disciplined student "
    "and teacher who lives in India. Answer in one or two short sentences. "
    "Write in natural, warm Romanised Hindi (Latin script, Hinglish) unless the "
    "user writes in English. Never change or reschedule his routine unless he "
    "explicitly asks. Be encouraging, concrete and brief."
)

FALLBACKS = [
    "Ronny, discipline woh hai jo aapko tab bhi aage badhata hai jab mann na kare. Ek chhota kadam aaj uthaiye.",
    "Hello Ronny! Bade sapne chhote regular kadamon se bante hain. Aaj ka ek kaam poora kar dijiye.",
    "Ronny, aapki mehnat aapke future ki nayi shuruaat hai. Aaj himmat mat haariye.",
]


def call_provider(message, context):
    """Ask the configured LLM. Returns None when unavailable."""
    if PROVIDER == "offline":
        return None

    if PROVIDER == "anthropic":
        url = "https://api.anthropic.com/v1/messages"
        payload = {
            "model": os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
            "max_tokens": 220,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": message}],
        }
        headers = {
            "content-type": "application/json",
            "x-api-key": PROVIDER_KEY,
            "anthropic-version": "2023-06-01",
        }
    else:
        url = "https://api.openai.com/v1/chat/completions"
        payload = {
            "model": os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
            "max_tokens": 220,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": message},
            ],
        }
        headers = {"content-type": "application/json",
                   "authorization": "Bearer " + PROVIDER_KEY}

    request = urllib.request.Request(
        url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, ValueError) as exc:
        print("provider error:", exc, file=sys.stderr)
        return None

    if PROVIDER == "anthropic":
        blocks = body.get("content", [])
        return "".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip() or None
    choices = body.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "").strip() or None
    return None


class Handler(BaseHTTPRequestHandler):
    server_version = "RonnyAssistant/1.0"

    def _send(self, status, payload):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        if self.path.rstrip("/") in ("/", "/health"):
            self._send(200, {"ok": True, "provider": PROVIDER})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if not re.match(r"^/assist/?$", self.path.split("?")[0]):
            self._send(404, {"error": "not found"})
            return

        if TOKEN and self.headers.get("X-Ronny-Token") != TOKEN:
            self._send(401, {"error": "bad token"})
            return

        length = int(self.headers.get("Content-Length") or 0)
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8")) if length else {}
        except ValueError:
            self._send(400, {"error": "invalid json"})
            return

        message = str(body.get("message", ""))[:2000]
        context = body.get("context", {})
        if not message:
            self._send(400, {"error": "empty message"})
            return

        reply = call_provider(message, context)
        source = PROVIDER
        if not reply:
            reply = FALLBACKS[len(message) % len(FALLBACKS)]
            source = "offline"

        self._send(200, {"reply": reply, "source": source})

    def log_message(self, fmt, *args):
        # Deliberately quiet: Ronny's messages are never written to disk.
        if os.environ.get("RONNY_VERBOSE"):
            super().log_message(fmt, *args)


def main():
    print("Ronny assistant backend on http://0.0.0.0:%d" % PORT)
    print("  provider : %s" % PROVIDER)
    print("  token    : %s" % ("required" if TOKEN else "disabled (local use only)"))
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
