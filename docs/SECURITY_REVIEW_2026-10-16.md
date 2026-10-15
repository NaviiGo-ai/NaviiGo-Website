# Security hardening review — 16 October 2026

This is a bounded source review and regression exercise, not a penetration-test certification. No real payments, destructive production probes, bulk traffic or business outreach were used.

## Fixed

| Area | Previous gap | Enforcement |
| --- | --- | --- |
| Admin API | Any signed-in account could clear caches and inspect another account's diagnostic context/trips. | All five admin routes require the literal trusted Firebase custom claim `admin: true`. Missing, revoked or ordinary user tokens fail closed. |
| Personalization | Taste and recommendation requests trusted a body-supplied user ID for privileged reads/writes. | Server identity comes from a verified token; conflicting IDs are rejected before service calls. Anonymous recommendations cannot load a stored profile. |
| Firebase sessions | Revoked/disabled sessions were not explicitly checked by the shared verifier. | Firebase Admin verification uses `check_revoked=True`, outside the async event loop. |
| Wallet mirrors | The owner catch-all allowed a client to forge balance and transaction documents. | `users/{uid}/wallet/**` and `wallet_transactions/**` remain owner-readable but reject every client write, including nested paths. Admin SDK/server writes remain available. This does not enable wallet spending/refunds. |
| URL fetching | Redirects were validated after connecting; hostname resolution could change between validation and connect; body limits applied after buffering. | Validate every hop before connection, pin a public DNS answer, preserve TLS SNI/Host verification, disable environment proxies and pooled cross-host connections, stream with a size cap and overall deadline. |
| AI abuse/error disclosure | Chat had no route-level rate cap and returned raw upstream exception text. | Ten requests/minute using the existing IP limiter, bounded message/history/context, generic upstream errors. |
| Website headers | Production permitted JavaScript eval and did not explicitly prohibit object embeds. | Remove `unsafe-eval`; add `object-src 'none'`. Existing Firebase and booking integrations retain their allowed origins. |
| Dependencies | Installed backend and several website development dependencies had known advisories. | Upgrade compatible backend packages and their transitive security floors; apply non-breaking npm audit fixes to the lockfile. |

## Verification

- Backend: **215 tests passed**, including authorization, SSRF, chat rate/size limits, payment ownership, idempotency and wallet regressions. One existing Pydantic deprecation warning remains.
- Firebase emulator: **13 tests passed**, including wallet forgery/deletion, private ownership and public itinerary projection boundaries.
- Website: **38 tests passed**, zero-warning lint and a successful production build.
- Public HTTPS fetch smoke test: successful with DNS pinning and normal TLS verification.
- Razorpay 2 SDK: local valid-signature acceptance and forged-signature rejection passed; no transaction was created.
- Full installed Python dependency audit: **no known vulnerabilities reported**. `pip check` passes.
- npm production dependency audit: **0 reported vulnerabilities**.
- Tracked website source scan: no matches for the bounded private-key, GitHub token, AWS access-ID and Stripe live-key patterns. This is not a historical or exhaustive secret scan.
- Hardened Firebase rules compiled and were deployed to the existing **naviigo-firebase / naviigo-db** configuration.

## Operational limits and follow-ups

- **14 development-tool dependency advisories remain (8 high, 6 moderate)** in the Firebase CLI / Tailwind / ESLint transitive chains. They are excluded from the npm production audit, but build environments still need protection. Do not use `npm audit fix --force`: it proposes breaking framework/toolchain changes. A separately tested toolchain migration is required; the braces advisory currently has no published patched version in its existing release line.
- Existing rate-limit storage/configuration is unchanged. Per-process limits are not a distributed bot/DDoS defence; confirm trusted proxy settings and use shared storage/edge limits before scaling workers.
- CSP retains `unsafe-inline` for the current static Next.js integration and existing third-party script origins. A nonce/strict-dynamic conversion needs a separate rendering/integration change.
- Google sign-in from the local `127.0.0.1` preview was blocked by Firebase's existing authorized-domain configuration. No domains or credentials were broadened for testing.
- Real-device session changes, release signing, physical-device storage, deployed payment/webhook behaviour, infrastructure IAM and comprehensive penetration testing remain outside this exercise. The wallet's previous fail-closed spending/refund restrictions remain in place.
- Admin access is deliberately not granted to anyone by this patch. Provision the custom claim only through an already trusted Admin SDK workflow; a user-editable profile field is never an admin credential.
- Previously client-computed leaderboard XP remains gameable. Do not attach money or redeemable rewards to it without server-authoritative computation.

The companion Flutter patch binds every authenticated API request to its starting account, drops responses after account changes, enforces HTTPS in release account requests, and rejects cross-origin redirects while preserving same-origin slash canonicalization. Its independent test/build results are recorded in the task report.
