# -*- coding: utf-8 -*-
"""Wrap a PNG into a single-page, print-ready PDF (A4, 300 dpi) — no external deps beyond Pillow."""
import sys, zlib
from PIL import Image

def png_to_pdf(png_path, pdf_path, dpi=300, page_w_pt=595.276, page_h_pt=841.89, margin_pt=0):
    im = Image.open(png_path).convert("RGB")
    w, h = im.size
    scale = min((page_w_pt - 2 * margin_pt) / w, (page_h_pt - 2 * margin_pt) / h)
    dw, dh = w * scale, h * scale
    ox, oy = (page_w_pt - dw) / 2, (page_h_pt - dh) / 2
    raw = im.tobytes()
    comp = zlib.compress(raw, 9)

    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.3f %.3f] "
                 "/Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>"
                 % (page_w_pt, page_h_pt)).encode())
    content = ("q %.3f 0 0 %.3f %.3f %.3f cm /Im0 Do Q" % (dw, dh, ox, oy)).encode()
    objs.append(b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream")
    objs.append(("<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB "
                 "/BitsPerComponent 8 /Filter /FlateDecode /Length %d >>\nstream\n" % (w, h, len(comp))).encode()
                + comp + b"\nendstream")

    out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = []
    for i, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += str(i).encode() + b" 0 obj\n" + body + b"\nendobj\n"
    xref_pos = len(out)
    out += b"xref\n0 " + str(len(objs) + 1).encode() + b"\n0000000000 65535 f \n"
    for off in offsets:
        out += ("%010d 00000 n \n" % off).encode()
    out += (b"trailer\n<< /Size " + str(len(objs) + 1).encode() + b" /Root 1 0 R >>\nstartxref\n"
            + str(xref_pos).encode() + b"\n%%EOF\n")
    open(pdf_path, "wb").write(bytes(out))
    return len(out)

SIZES = {"a4": (595.276, 841.89), "a3": (841.89, 1190.551)}

if __name__ == "__main__":
    src, dst = sys.argv[1], sys.argv[2]
    size = sys.argv[3].lower() if len(sys.argv) > 3 else "a4"
    pw, ph = SIZES[size]
    n = png_to_pdf(src, dst, page_w_pt=pw, page_h_pt=ph)
    print(f"wrote {dst} ({size.upper()}, {n/1e6:.2f} MB)")
