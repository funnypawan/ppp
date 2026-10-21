# Security and privacy design

## Threat model

Protect against accidental access to known adult domains by the consenting device owner. The local PIN adds friction. The Android OS, app sandbox, Keystore, HTTPS trust store, selected DNS provider and downloaded list maintainers are trusted. Root, malicious OS, a determined device owner and a hostile administrator are out of scope. The app neither hides itself nor asserts device administration.

## Data flow

```
Application using system DNS
  → virtual DNS 10.111.0.2, UDP/IPv4, local TUN
  → validate packet and single DNS question
  → domain + parent suffix match → NXDOMAIN + encrypted local log
  → optional Google SafeSearch mapping
  → TTL-bounded cache or Cloudflare Families HTTPS DNS
  → validated UDP reply to TUN

Normal HTTP(S), IP and IPv6 website traffic → ordinary device network
Update request → source HTTPS (no activity log attached)
```

Cloudflare sees allowed domains/IP metadata; it is not a local-only resolver. Blocked local requests are not forwarded. Provider zero-address answers are indicators, not proof of adult content. Family filtering also blocks malicious domains. DNS cache contains allowed queries temporarily in RAM, never writes them to history. Blocklist downloads are opt-in/manual or explicitly scheduled, with a 32 MiB ceiling and bounded duration. The source is fixed in code, no arbitrary update URL input.

## Controls

- Minimal permissions: internet, network state, foreground service/special-use, notifications and boot reminder. VPN permission is a system dialog, not a runtime `uses-permission` request for BIND_VPN_SERVICE. Service is protected by that signature-level binding permission; update job is protected by BIND_JOB_SERVICE.
- AES-GCM Keystore key and fresh random IV per write; settings/history backup disabled. PIN uses random 16-byte salt, 210,000 PBKDF2-HMAC-SHA256 iterations, 256-bit result and constant-time comparison. Password entry disables autofill and screenshots. Retry delay after five failures is persisted; device-clock tampering remains possible.
- Max 200 history rows, no URLs/passwords/page bodies. Clear local history also clears count. Last ~2 seconds may not survive abrupt process death. Storage errors are not evidence of a block failing; UI shows a history warning.
- Standard platform HTTPS certificate validation; no insecure fallback or trust-all manager. Network DNS resolution of the DoH endpoint and update hostname occurs on the underlying network because SafeShield's own package is excluded. This small bootstrap DNS exposure is distinct from forwarding allowed browsing queries over HTTPS.
- No exported unauthenticated stop/settings intent. System revocation and uninstall always remain possible.
- Blocklist atomically replaced after validation; source is not signed/pinned to a release, so HTTPS, maintainers and host compromise are residual risks. Review upstream license/changes before release. Format/sentinel checks are not authenticity signatures.
- Two DNS workers, 32 pending requests, 256 cache entries, ≤60s cache TTL, bounded DNS responses. No busy polling loop or periodic vault write when idle.

## Fail-open vs enforcement

DNS failures return SERVFAIL temporarily. After three consecutive query/transport failures, TUN is released and filtering stops. This prioritizes connectivity over enforcement. Always-on policy may restart it. No automatic claim that the connection is filtered while disconnected. Lockdown is not supported for this split-route design; Android lockdown can prevent fail-open connectivity. Explain this before deployment.

## Known limitations / review items

No DNS-over-TCP handling; no arbitrary DNS/IPv6 egress capture; no full IP tunnel; no encrypted-DNS interception; no traffic classifier; no custom browser. Unsupported packet formats may time out rather than receive a useful error. False positives and unknown adult domains remain. Google mapping covers two hostnames only. An HTTPS denial appears as a browser connection error, not an injected blocked page.

A security reviewer should focus on TUN/FD teardown and OEM lifecycle behavior, resolver/packet fuzzing beyond the included bounded smoke tests, encrypted-store failure paths, source freshness/integrity, privacy disclosures, PIN throttling usability and live network bypasses. Verify dependencies/wrapper provenance using your normal supply-chain controls. Do not interpret the source compilation check as an audit.
