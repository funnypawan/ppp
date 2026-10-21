#!/usr/bin/env python3
"""
Build Ronny Personal Assistant into a signed APK **without Gradle**.

The normal way to build this project is Android Studio / `./gradlew assembleDebug`
(see README.md).  This script exists so the APK can also be produced on a
machine that only has a JDK, Python and the tiny toolchain in `tools/toolchain`
(aapt2, d8, apksigner, android.jar, javac).  It has no external dependencies.

Usage:
    python3 tools/fetch-toolchain.py     # one time, downloads the toolchain
    python3 tools/offline-build.py       # produces  release/RonnyPersonalAssistant.apk
"""
from __future__ import print_function

import os
import shutil
import subprocess
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
APP = os.path.join(ROOT, "app", "src", "main")
TOOLS = os.path.join(HERE, "toolchain")
BUILD = os.path.join(ROOT, "build", "offline")
RELEASE = os.path.join(ROOT, "release")

PACKAGE = "com.ronny.assistant"
MIN_SDK = "26"
TARGET_SDK = "34"
APK_NAME = "RonnyPersonalAssistant.apk"

AAPT2 = os.path.join(TOOLS, "aapt2")
ANDROID_JAR = os.path.join(TOOLS, "android.jar")
D8_JAR = os.path.join(TOOLS, "d8.jar")
APKSIGNER_JAR = os.path.join(TOOLS, "apksigner.jar")
JAVAC_JAR = os.path.join(TOOLS, "jdk8-tools.jar")   # OpenJDK 8 tools.jar (javac)
ECJ_JAR = os.path.join(TOOLS, "ecj.jar")            # Eclipse compiler (fallback)


# --------------------------------------------------------------------------- #
def fail(message):
    print("\n*** BUILD FAILED: %s\n" % message, file=sys.stderr)
    sys.exit(1)


def run(cmd, cwd=None):
    print("  + " + " ".join(cmd[:4]) + (" ..." if len(cmd) > 4 else ""))
    proc = subprocess.run(cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    if proc.returncode != 0:
        sys.stdout.write(proc.stdout.decode("utf-8", "replace"))
        fail("command exited with %d" % proc.returncode)
    return proc.stdout.decode("utf-8", "replace")


def java_home():
    env = os.environ.get("JAVA_HOME")
    if env:
        return env
    # Fall back to the JDK that ships with the `jdk4py` pip package, if present.
    try:
        import jdk4py
        return str(jdk4py.JAVA_HOME)
    except Exception:
        return None


def java_bin():
    home = java_home()
    if home and os.path.exists(os.path.join(home, "bin", "java")):
        return os.path.join(home, "bin", "java")
    return "java"


def pick_compiler():
    """Return the javac invocation that works on this machine."""
    java = java_bin()
    if os.path.exists(JAVAC_JAR):
        return [java, "-Xmx1g", "-cp", JAVAC_JAR, "com.sun.tools.javac.Main"]
    if os.path.exists(ECJ_JAR):
        return [java, "-Xmx1g", "-cp", ECJ_JAR, "org.eclipse.jdt.internal.compiler.batch.Main"]
    fail("No Java compiler found. Run tools/fetch-toolchain.py first.")


# --------------------------------------------------------------------------- #
def zipalign(src, dst, align=4):
    """Rewrite the zip so every STORED entry's payload starts on a 4-byte boundary."""
    zin = zipfile.ZipFile(src)
    entries = [(info, zin.read(info.filename)) for info in zin.infolist()]
    zin.close()

    with zipfile.ZipFile(dst, "w") as out:
        for info, data in entries:
            new = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            new.compress_type = info.compress_type
            new.external_attr = info.external_attr
            new.internal_attr = info.internal_attr
            new.create_system = info.create_system
            new.extra = info.extra
            if info.compress_type == zipfile.ZIP_STORED:
                header = 30 + len(new.filename.encode("utf-8")) + len(new.extra)
                pad = (align - ((out.fp.tell() + header) % align)) % align
                new.extra = new.extra + b"\x00" * pad
            out.writestr(new, data)


def main():
    for path, label in ((AAPT2, "aapt2"), (ANDROID_JAR, "android.jar"),
                        (D8_JAR, "d8.jar"), (APKSIGNER_JAR, "apksigner.jar")):
        if not os.path.exists(path):
            fail("Missing %s (%s). Run: python3 tools/fetch-toolchain.py" % (label, path))

    if os.path.isdir(BUILD):
        shutil.rmtree(BUILD)
    for sub in ("compiled", "gen", "classes", "dex"):
        os.makedirs(os.path.join(BUILD, sub))

    print("== Compiling resources")
    run([AAPT2, "compile", "--dir", os.path.join(APP, "res"),
         "-o", os.path.join(BUILD, "compiled", "res.zip")])

    print("== Linking APK (resources + manifest)")
    run([AAPT2, "link",
         "-I", ANDROID_JAR,
         "--manifest", os.path.join(APP, "AndroidManifest.xml"),
         "-o", os.path.join(BUILD, "base.apk"),
         "--min-sdk-version", MIN_SDK,
         "--target-sdk-version", TARGET_SDK,
         "--java", os.path.join(BUILD, "gen"),
         "--auto-add-overlay",
         "-v", os.path.join(BUILD, "compiled", "res.zip")])

    print("== Compiling Java sources")
    sources = []
    for base in (os.path.join(APP, "java"), os.path.join(BUILD, "gen")):
        for dirpath, _dirnames, filenames in os.walk(base):
            for name in filenames:
                if name.endswith(".java"):
                    sources.append(os.path.join(dirpath, name))
    sources.sort()
    print("     %d source files" % len(sources))
    run(pick_compiler() + [
        "-encoding", "UTF-8",
        "-source", "8", "-target", "8",
        "-nowarn",
        "-bootclasspath", ANDROID_JAR,
        "-cp", ANDROID_JAR,
        "-d", os.path.join(BUILD, "classes"),
    ] + sources)

    print("== Converting to Dalvik bytecode (d8)")
    class_files = []
    for dirpath, _dirnames, filenames in os.walk(os.path.join(BUILD, "classes")):
        for name in filenames:
            if name.endswith(".class"):
                class_files.append(os.path.join(dirpath, name))
    run([java_bin(), "-Xmx1g", "-cp", D8_JAR, "com.android.tools.r8.D8",
         "--min-api", MIN_SDK, "--lib", ANDROID_JAR,
         "--output", os.path.join(BUILD, "dex")] + class_files)

    print("== Merging classes.dex into the APK")
    merged = os.path.join(BUILD, "merged.apk")
    zin = zipfile.ZipFile(os.path.join(BUILD, "base.apk"))
    entries = [(info, zin.read(info.filename)) for info in zin.infolist()]
    zin.close()
    with zipfile.ZipFile(merged, "w") as out:
        for name in sorted(os.listdir(os.path.join(BUILD, "dex"))):
            if not name.endswith(".dex"):
                continue
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_STORED
            info.external_attr = 0o644 << 16
            with open(os.path.join(BUILD, "dex", name), "rb") as handle:
                out.writestr(info, handle.read())
        for info, data in entries:
            new = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            new.compress_type = info.compress_type
            new.external_attr = info.external_attr
            new.create_system = info.create_system
            out.writestr(new, data)

    aligned = os.path.join(BUILD, "aligned.apk")
    zipalign(merged, aligned)
    print("     aligned APK: %.1f KB" % (os.path.getsize(aligned) / 1024.0))

    print("== Signing (v1 + v2, RSA-2048)")
    keystore = os.path.join(TOOLS, "ronny.jks")
    if not os.path.exists(keystore):
        p12 = os.path.join(BUILD, "signing-key.p12")
        key = os.path.join(BUILD, "signing-key.pem")
        cert = os.path.join(BUILD, "signing-cert.pem")
        run(["openssl", "req", "-x509", "-newkey", "rsa:2048",
             "-keyout", key, "-out", cert, "-days", "10950", "-nodes",
             "-subj", "/CN=Ronny Personal Assistant/O=Ronny/C=IN"])
        run(["openssl", "pkcs12", "-export", "-inkey", key, "-in", cert,
             "-out", p12, "-name", "ronny", "-passout", "pass:ronny"])
        os.replace(p12, keystore)
    else:
        keystore = os.path.join(BUILD, "signing-key.p12")
        if not os.path.exists(keystore):
            key = os.path.join(BUILD, "signing-key.pem")
            cert = os.path.join(BUILD, "signing-cert.pem")
            run(["openssl", "req", "-x509", "-newkey", "rsa:2048",
                 "-keyout", key, "-out", cert, "-days", "10950", "-nodes",
                 "-subj", "/CN=Ronny Personal Assistant/O=Ronny/C=IN"])
            run(["openssl", "pkcs12", "-export", "-inkey", key, "-in", cert,
                 "-out", keystore, "-name", "ronny", "-passout", "pass:ronny"])

    if not os.path.isdir(RELEASE):
        os.makedirs(RELEASE)
    signed = os.path.join(RELEASE, APK_NAME)
    if os.path.exists(signed):
        os.remove(signed)
    run([java_bin(), "-cp", APKSIGNER_JAR, "com.android.apksigner.ApkSignerTool", "sign",
         "--ks", keystore, "--ks-type", "PKCS12", "--ks-key-alias", "ronny",
         "--ks-pass", "pass:ronny", "--key-pass", "pass:ronny",
         "--min-sdk-version", MIN_SDK,
         "--v1-signing-enabled", "true",
         "--v2-signing-enabled", "true",
         "--out", signed, "--in", aligned])

    print("== Verifying")
    out = run([java_bin(), "-cp", APKSIGNER_JAR, "com.android.apksigner.ApkSignerTool",
               "verify", "--print-certs", signed])
    sys.stdout.write(out)

    with zipfile.ZipFile(signed) as apk:
        names = apk.namelist()
    for required in ("AndroidManifest.xml", "classes.dex", "resources.arsc"):
        if required not in names:
            fail("APK is missing %s" % required)
    print("     entries: %d" % len(names))

    print("\nOK -> %s (%.1f KB)\n" % (signed, os.path.getsize(signed) / 1024.0))


if __name__ == "__main__":
    main()
