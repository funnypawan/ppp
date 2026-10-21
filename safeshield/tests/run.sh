#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")/.."
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT
javac -encoding UTF-8 -d "$OUT" app/src/main/java/app/safeshield/DomainRules.java app/src/main/java/app/safeshield/Dns.java app/src/main/java/app/safeshield/DnsCache.java tests/CoreTests.java
java -cp "$OUT" app.safeshield.CoreTests
