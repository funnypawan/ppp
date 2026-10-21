#!/usr/bin/env python3
"""
Download the tiny toolchain that `offline-build.py` needs.

You do **not** need this if you build with Android Studio / Gradle - it downloads
the whole Android SDK for you.  This script is only for the Gradle-free build.

Sources (all fetched at build time, nothing is vendored into git):
  * aapt2        - pip package `aapt2` (contains the Linux binary)
  * d8.jar       - npm package `@drxiaozhi/minapk` (bundles d8, apksigner, android.jar, ecj)
  * jdk8-tools   - npm package `dataslope-tools-jar` (OpenJDK 8 tools.jar -> javac)
  * a JRE        - pip package `jdk4py`, used to run the Java tools
"""
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(HERE, "toolchain")


def run(cmd, cwd=None):
    print("  + " + " ".join(cmd))
    subprocess.check_call(cmd, cwd=cwd)


def pip(*args):
    cmd = [sys.executable, "-m", "pip", "install", "--quiet", "--target",
           os.path.join(HERE, ".piptmp")] + list(args)
    run(cmd)


def npm_pack(spec, dest_dir):
    """npm pack <spec> into dest_dir and return the path of the tarball."""
    os.makedirs(dest_dir, exist_ok=True)
    before = set(os.listdir(dest_dir))
    subprocess.check_call(["npm", "pack", spec], cwd=dest_dir,
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    after = set(os.listdir(dest_dir))
    new = list(after - before)
    if not new:
        raise RuntimeError("npm pack produced nothing for " + spec)
    return os.path.join(dest_dir, new[0])


def extract_tarball(tarball, dest):
    os.makedirs(dest, exist_ok=True)
    if tarball.endswith(".whl") or tarball.endswith(".zip"):
        with zipfile.ZipFile(tarball) as z:
            z.extractall(dest)
    else:
        subprocess.check_call(["tar", "xzf", tarball], cwd=dest)


def main():
    os.makedirs(TOOLS, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="ronny-tools-")
    try:
        # ------------------------------------------------------------ aapt2
        if not os.path.exists(os.path.join(TOOLS, "aapt2")):
            print("== aapt2 (pip: aapt2)")
            pip("aapt2")
            src = None
            for dirpath, _dirs, files in os.walk(os.path.join(HERE, ".piptmp")):
                if os.path.basename(dirpath) == "bin" and "aapt2" in files:
                    src = os.path.join(dirpath, "aapt2")
            if src is None:
                raise RuntimeError("could not find aapt2 inside the pip package")
            shutil.copy(src, os.path.join(TOOLS, "aapt2"))
            os.chmod(os.path.join(TOOLS, "aapt2"), 0o755)

        # --------------------------------------------------- d8 + apksigner
        if not all(os.path.exists(os.path.join(TOOLS, n))
                   for n in ("d8.jar", "apksigner.jar", "android.jar", "ecj.jar")):
            print("== d8 / apksigner / android.jar / ecj (npm: @drxiaozhi/minapk)")
            tgz = npm_pack("@drxiaozhi/minapk", tmp)
            dest = os.path.join(tmp, "minapk")
            extract_tarball(tgz, dest)
            pkg = os.path.join(dest, "package", "tools")
            for name in ("d8.jar", "apksigner.jar", "android.jar"):
                shutil.copy(os.path.join(pkg, name), os.path.join(TOOLS, name))
            for candidate in os.listdir(pkg):
                if candidate.startswith("ecj"):
                    shutil.copy(os.path.join(pkg, candidate),
                                os.path.join(TOOLS, "ecj.jar"))

        # ------------------------------------------------------------- javac
        if not os.path.exists(os.path.join(TOOLS, "jdk8-tools.jar")):
            print("== javac (npm: dataslope-tools-jar)")
            tgz = npm_pack("dataslope-tools-jar", tmp)
            dest = os.path.join(tmp, "toolsjar")
            extract_tarball(tgz, dest)
            shutil.copy(os.path.join(dest, "package", "tools.jar"),
                        os.path.join(TOOLS, "jdk8-tools.jar"))

        # -------------------------------------------------------- jre (pip)
        try:
            import jdk4py  # noqa: F401
            print("== JRE already available (jdk4py)")
        except Exception:
            print("== JRE (pip: jdk4py)")
            cmd = [sys.executable, "-m", "pip", "install", "--quiet"]
            if not os.access(os.path.dirname(sys.executable), os.W_OK):
                cmd.append("--break-system-packages")
            cmd.append("jdk4py")
            run(cmd)
    finally:
        shutil.rmtree(os.path.join(HERE, ".piptmp"), ignore_errors=True)
        shutil.rmtree(tmp, ignore_errors=True)

    print("\nToolchain ready in %s:" % TOOLS)
    for name in sorted(os.listdir(TOOLS)):
        print("  %-20s %8.1f KB" % (name, os.path.getsize(os.path.join(TOOLS, name)) / 1024.0))
    print("\nNow run:  python3 tools/offline-build.py")


if __name__ == "__main__":
    main()
