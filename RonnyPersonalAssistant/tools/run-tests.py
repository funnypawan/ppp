#!/usr/bin/env python3
"""
Compile and run the pure-logic unit tests for Ronny Personal Assistant.

The tests exercise the parts of the app that decide *when* something happens and
*what* is spoken, so they run on a plain JVM with `android.jar` on the class
path (no emulator needed).

    python3 tools/run-tests.py
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TOOLS = os.path.join(HERE, "toolchain")
BUILD = os.path.join(ROOT, "build", "tests")
CLASSES = os.path.join(ROOT, "build", "offline", "classes")
TEST_SRC = os.path.join(HERE, "tests", "LogicTest.java")


def java_bin():
    home = os.environ.get("JAVA_HOME")
    if home and os.path.exists(os.path.join(home, "bin", "java")):
        return os.path.join(home, "bin", "java")
    try:
        import jdk4py
        return str(jdk4py.JAVA_HOME / "bin" / "java")
    except Exception:
        return "java"


def javac_command():
    java = java_bin()
    tools_jar = os.path.join(TOOLS, "jdk8-tools.jar")
    if os.path.exists(tools_jar):
        return [java, "-cp", tools_jar, "com.sun.tools.javac.Main"]
    ecj = os.path.join(TOOLS, "ecj.jar")
    if os.path.exists(ecj):
        return [java, "-cp", ecj, "org.eclipse.jdt.internal.compiler.batch.Main"]
    print("No Java compiler found. Run: python3 tools/fetch-toolchain.py", file=sys.stderr)
    sys.exit(1)


def main():
    android_jar = os.path.join(TOOLS, "android.jar")
    if not os.path.exists(android_jar):
        print("Missing %s. Run: python3 tools/fetch-toolchain.py" % android_jar, file=sys.stderr)
        sys.exit(1)
    if not os.path.isdir(CLASSES):
        print("No compiled app classes. Run: python3 tools/offline-build.py first.", file=sys.stderr)
        sys.exit(1)

    if os.path.isdir(BUILD):
        shutil.rmtree(BUILD)
    os.makedirs(BUILD)

    cmd = javac_command() + [
        "-encoding", "UTF-8", "-nowarn",
        "-bootclasspath", android_jar,
        "-cp", android_jar + os.pathsep + CLASSES,
        "-d", BUILD,
        TEST_SRC,
    ]
    if subprocess.call(cmd) != 0:
        sys.exit(1)

    sys.exit(subprocess.call(
        [java_bin(), "-cp", CLASSES + os.pathsep + BUILD, "LogicTest"]))


if __name__ == "__main__":
    main()
