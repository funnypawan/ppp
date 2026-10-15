"""Tiny download server: serves a clickable download page + the deck files.

Every file is sent with Content-Disposition: attachment so clicking a button
downloads it (even on mobile browsers).
"""
from __future__ import annotations

import html
import os
import socketserver
import urllib.parse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = 8000

FILES = [
    ("DREAM_CLASSES_KOTHWARA_Physics_Ch4_Vidyut_VVI_Objective_QUESTIONS_plus_ANSWERKEY.pdf",
     "📄 Combined PDF — 39 pages (Questions + Answer Key)", "print / WhatsApp / mobile"),
    ("Dream_Classes_Kothwara_Physics_Ch4_Electricity_VVI_Objective.pptx",
     "🎓 PPTX — 35 slides (editable teaching deck)", "PowerPoint / classroom / projector"),
    ("Dream_Classes_Kothwara_Physics_Ch4_Electricity_VVI_Objective_with_AnswerKey.pptx",
     "🔑 PPTX — 39 slides (editable + teacher answer key)", "PowerPoint / teacher copy"),
]

CT = {".pdf": "application/pdf",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"}


def page():
    rows = []
    for name, title, sub in FILES:
        path = os.path.join(ROOT, name)
        size = os.path.getsize(path) / 1e6 if os.path.exists(path) else 0
        rows.append(f"""
    <a class="card" href="/file/{urllib.parse.quote(name)}" download>
      <div class="t">{html.escape(title)}</div>
      <div class="s">{html.escape(sub)} &nbsp;•&nbsp; {size:.2f} MB</div>
      <div class="b">⬇  DOWNLOAD</div>
    </a>""")
    return f"""<!doctype html>
<html lang="hi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DREAM CLASSES KOTHWARA — Downloads</title>
<style>
  body{{margin:0;background:#0a0f0c;color:#eef2ea;font-family:system-ui,Segoe UI,Roboto,sans-serif}}
  header{{padding:26px 20px 18px;text-align:center;border-bottom:2px solid #f7c84655}}
  h1{{margin:0 0 6px;font-size:22px;letter-spacing:2px;color:#fff}}
  h2{{margin:0;font-size:15px;font-weight:600;color:#f7c846}}
  .sub{{margin-top:8px;font-size:13px;color:#a8b6aa}}
  .wrap{{max-width:820px;margin:0 auto;padding:22px 18px 60px}}
  .card{{display:block;text-decoration:none;background:#121a14;border:2px solid #f7c84655;
        border-radius:14px;padding:18px 20px;margin:14px 0;transition:.15s}}
  .card:hover,.card:active{{border-color:#f7c846;background:#18231a}}
  .t{{font-size:17px;font-weight:700;color:#fff}}
  .s{{font-size:13px;color:#a8b6aa;margin:6px 0 12px}}
  .b{{display:inline-block;background:#b70c1e;color:#fff;font-weight:700;font-size:14px;
      padding:10px 20px;border-radius:24px;letter-spacing:.6px}}
  .note{{margin-top:26px;font-size:13px;color:#a8b6aa;line-height:1.7}}
  .note b{{color:#f7c846}}
</style></head><body>
<header>
  <h1>DREAM CLASSES KOTHWARA</h1>
  <h2>PHYSICS  •  अध्याय-04 विद्युत (ELECTRICITY)  •  10वीं कक्षा</h2>
  <div class="sub">VVI OBJECTIVE QUESTIONS — By: Dream Sir &nbsp;•&nbsp; Mob: +91 97089 83294</div>
</header>
<div class="wrap">
  {''.join(rows)}
  <div class="note">
    <b>PDF</b> — 39 pages: title + chapter divider + Q.1–Q.32 + उत्तर कुंजी (Answer Key) + closing slide.<br>
    <b>PPTX</b> — editable, 16:9, blackboard design, Hindi fonts embedded (कोई □□□ नहीं).<br>
    Button दबाने पर file सीधे download हो जाएगी — mobile, laptop, TV किसी पर भी।
  </div>
</div></body></html>"""


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *args):
        print("%s - %s" % (self.address_string(), fmt % args), flush=True)

    def do_HEAD(self):
        self._serve(head=True)

    def do_GET(self):
        self._serve(head=False)

    def _serve(self, head: bool):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            body = page().encode()
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if not head:
                self.wfile.write(body)
            return
        if path.startswith("/file/"):
            name = urllib.parse.unquote(path[len("/file/"):])
            safe = os.path.basename(name)
            full = os.path.join(ROOT, safe)
            if os.path.isfile(full) and safe in [f[0] for f in FILES]:
                size = os.path.getsize(full)
                ext = os.path.splitext(safe)[1].lower()
                self.send_response(HTTPStatus.OK)
                self.send_header("Content-Type", CT.get(ext, "application/octet-stream"))
                self.send_header("Content-Length", str(size))
                self.send_header("Content-Disposition",
                                 f'attachment; filename="{safe}"')
                self.send_header("Accept-Ranges", "none")
                self.end_headers()
                if not head:
                    with open(full, "rb") as fh:
                        while True:
                            chunk = fh.read(1 << 16)
                            if not chunk:
                                break
                            try:
                                self.wfile.write(chunk)
                            except (BrokenPipeError, ConnectionResetError):
                                return
                return
        self.send_error(HTTPStatus.NOT_FOUND, "File not found")


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    print(f"serving {ROOT} on 0.0.0.0:{PORT}", flush=True)
    Server(("0.0.0.0", PORT), Handler).serve_forever()
