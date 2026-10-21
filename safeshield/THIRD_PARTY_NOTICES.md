# Third-party services and build components

The application adds no runtime Maven libraries. Android platform APIs and the Android build tools have their respective upstream licenses. The repository's existing license remains unchanged; review it before distribution.

## Gradle wrapper

`gradlew`, `gradlew.bat` and `gradle-wrapper.jar` were obtained from the Gradle repository tag `v8.11.1` using GitHub's API. Gradle is Apache License 2.0:
https://github.com/gradle/gradle/blob/v8.11.1/LICENSE

## Domain data

The bundled ten-domain seed is a small factual list curated for this project. The larger list is downloaded, not bundled, from:
https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts

Project, credits, component sources and licensing:
https://github.com/StevenBlack/hosts
https://github.com/StevenBlack/hosts/blob/master/license.txt

The unified hosts list aggregates independently maintained data; preserve upstream file headers (the updater keeps the full downloaded file) and review **all relevant source terms** before redistributing a cached list. Downloading it does not mean every upstream source has an identical license. This variant also includes ads/tracking/malware entries. SafeShield is not affiliated with or endorsed by the maintainers.

## DNS provider

Cloudflare for Families DNS-over-HTTPS, adult + malware filtering:
https://developers.cloudflare.com/1.1.1.1/setup/#1111-for-families
https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/make-api-requests/
https://developers.cloudflare.com/1.1.1.1/privacy/public-dns-resolver/

Provider behavior, availability and policies can change. SafeShield makes no independent claim of perfect classification or an availability guarantee and has no affiliation with Cloudflare.

## Supported search settings

Google SafeSearch network configuration:
https://support.google.com/websearch/answer/186669
Google SafeSearch user setting: https://www.google.com/safesearch
YouTube Restricted Mode: https://support.google.com/youtube/answer/174084
Family Link: https://families.google/familylink/

Google/YouTube names identify compatible services, not endorsement. Recheck documented IP mapping and supported hostnames before release.
