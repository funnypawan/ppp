# Verification report and release gates

Recorded **2026-10-21**. “Implemented” does not mean “device tested.” No adult images, pages or videos were loaded for testing.

## Verification results

| Check | Result | Scope |
|---|---|---|
| Domain rules / DNS / cache regression suite | **PASS, 35 checks** | Includes exact and adult subdomain matches, case/IDN normalization, suffix-spoof rejection, DNS denial replies, SafeSearch mapping, response ID/TC rejection, pointer loops, UDP validation, checksum, bounded cache and 10,000 deterministic malformed-input cases |
| All application Java sources | **PASS, source-level compilation** | Eclipse Java compiler 3.16, Java 8 bytecode, Android 35 API classes from the Reginer/aosp-android-jar mirror, Java base classes, and a temporary synthetic `R` containing the one drawable symbol. This is NOT Android resource linking, DEX compilation, lint, or APK assembly. Gradle uses Java 17 source/target; code uses Java 8-compatible syntax. Validation tooling is outside the repository. |
| Manifest / resource XML syntax | **PASS** | Python XML parse; not Android resource validation |
| `./gradlew :app:assembleDebug --no-daemon` | **BLOCKED** | Gradle distribution HTTPS download failed with SSL handshake termination under sandbox host restrictions. No Android SDK installed. Google Maven/SDK and Gradle distribution hosts unavailable. |
| Debug/release APK installation and launch | **NOT RUN** | APK now available, but no emulator or physical device installation test |
| GitHub Actions Gradle debug build | **PASS** | Run [39549519942](https://github.com/funnypawan/ppp/actions/runs/39549519942), Ubuntu 24.04, Temurin JDK 17, official Android SDK 35. Core tests passed and `:app:assembleDebug` generated the APK. Published as prerelease `safeshield-debug-2` (52,734 bytes). |
| Android lint | **NOT RUN** | Still required before release |

Run core tests with a full JDK (17 recommended):

```sh
cd safeshield
./tests/run.sh
```

These tests validate logic, not live VPN behavior or completeness of an adult-content classification service. The domain tests prove the bundled examples match; they do not prove that every adult domain is listed.

## Required device matrix — all pending

Test at least Android 8/API 26, 10/29, 12/31, 13/33, 14/34, 15/35 and 16/36. Include a Pixel-like device and an OEM with aggressive battery management. Target 35 support on newer OS versions must be checked, not inferred from compilation. Use physical devices for mobile data, OEM battery behavior, reboot and VPN coexistence.

Record device/model, OS/build, browser/version, Private DNS setting, browser DoH setting, list update date/count, network and exact outcome. Never mark a checklist item passed without observed evidence.

| Area | Procedure / expected result | Status |
|---|---|---|
| Consent | First enable explains provider/data flow; cancel Android VPN consent: remains OFF; accept: foreground VPN appears | Pending |
| Known domain / subdomain | Use a DNS query utility on-device with OS DNS, resolving a seed domain and an invented subdomain under it; both get NXDOMAIN and local logs. No need to view adult pages | Logic PASS; device pending |
| HTTPS + links | Controlled test build: add an organization-owned HTTPS test domain to the seed; open directly and from another app. Expect connection failure, no TLS interception, block log. Remove test seed before release | Pending |
| Normal HTTPS | With VPN ON, open several benign HTTPS sites and dual-stack sites; confirm browsing and AAAA resolution work | Pending |
| Browsers | Chrome, Firefox, Samsung Internet with normal system DNS, then with browser encrypted DNS. Record expected bypasses; never claim universal coverage | Pending |
| Wi-Fi | Enable on Wi-Fi, request benign + blocked DNS names repeatedly; observe replies, metrics and no general internet loss | Pending |
| Mobile data | Repeat on real cellular data; carrier IPv6-only/NAT64 network if available | Pending |
| Network switching | Wi-Fi → mobile → Wi-Fi, airplane mode cycle; caches reset, subsequent resolver connections follow network; failures may release VPN | Pending |
| Resolver failures | Controlled firewall/lab network denies family DNS HTTPS; make three queries. Expect temporary SERVFAIL and then VPN release/OFF status, normal DNS restored without lockdown | Pending |
| DNS errors | Lab resolver fixtures/transport adapter: malformed ID/question, truncated, oversized, SERVFAIL, REFUSED. Reject bad/failed replies; no poisoned cache | Parser cases PASS; transport pending |
| Overload | Burst beyond 2 workers + 32 queued queries; queue must stay bounded; overflow receives SERVFAIL; UI stays responsive | Pending |
| VPN disconnection | Revoke permission and activate another VPN; SafeShield OFF and no lingering TUN/foreground notification | Pending |
| Repeated lifecycle | Rapid start/stop, permission denial, rotate while connecting, force-stop; no leaked reader threads/FDs and truthful dashboard | Pending |
| Device restart | Always-on OFF: check reminder when notifications allowed, manually reconnect. Always-on ON, lockdown OFF: verify Android starts service after unlock | Pending |
| Lockdown negative case | Lab-only: demonstrate split-DNS lockdown limitation; turn lockdown OFF to restore normal traffic; warnings must be visible | Pending |
| Battery | Screen off/Doze for 1h; measure idle wakeups/CPU/battery, compare baseline; test OEM optimized/unrestricted app modes | Pending |
| Notifications | Deny Android 13 permission: VPN can still start and status remains visible in-app/system task manager; allow: status and optional generic notices appear | Pending |
| Manual list update | Download current source; verify count/date, new suffix blocks and cache invalidation; no DNS activity uploaded | Pending |
| Failed list update | Offline, invalid HTML, truncated list, wrong sentinel, excessive size, disk-full; previous valid list must remain usable | Pending |
| Scheduled update | Enable opt-in; run `adb shell cmd jobscheduler run -f app.safeshield 44`; check date. Disable and reboot: no recurring job | Pending |
| Concurrent update | Trigger manual and scheduled update together; one is rejected cleanly, no partial destination file | Pending |
| SafeSearch | With VPN on and option enabled, resolve google.com/www.google.com A → 216.239.38.120, AAAA/HTTPS → NODATA; verify Google page behavior. Regional domains deliberately not mapped | Wire mapping PASS; live pending |
| YouTube | Open official instructions; UI must NOT claim it enabled Restricted Mode or filtered all videos | Pending |
| PIN/Strict | Set matching 6–12 digits; verify settings/pause/history gates, wrong PIN, retry delays, restart persistence, rotation/background relocking | Pending |
| System bypass | Show uninstall, clear app data, system VPN settings and another VPN remain possible; no misleading anti-uninstall claims | Pending |
| Local privacy | Inspect debug app-private vault with `run-as`; no plaintext domain/PIN in preferences; no unrelated history/logcat; screenshots blocked; backups unavailable | Pending |
| Storage failures | Keystore invalidation/corrupt ciphertext: visible error, no silent PIN reset; low storage: report write failure, do not claim durable history | Pending |
| History | Latest 200 entries, accurate dates/timezone and request count, including duplicate requests; clear is irreversible and PIN-gated | Pending |
| Accessibility | TalkBack, font scale 200%, dark system setting, landscape/tablet, system insets on API 35/36, back gesture and keyboard on all screens | Pending |

## Release decision

**Do not ship as verified production protection yet.** Required gates: successful official SDK Gradle build/lint, signed install smoke test, device matrix, provider endpoint tests, upstream licensing review, performance profiling, security review and store-policy review. Fix failures, record evidence here, then decide whether the supported scope is suitable for release. No independent image-recognition or bypass-resistance certification exists.
