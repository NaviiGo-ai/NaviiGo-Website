# Phase 6 implementation handoff — 14 October 2026

Branch: `codex/phase-6-contract-alignment`. Canonical interface: [contract packet](phase_6_contract_packet.md). Companion mobile branch: `NaviiGoApp/astra/mobile-v2`.

## Delivered behavior

- Generation uses the authenticated Firebase UID, one caller UUIDv4/document ID, a request fingerprint and committed receipt. Same-operation retries reconcile instead of creating another trip. Explicit zero/empty/null inputs retain their meaning. The browser confirms the private owner document before announcing a save.
- Replan proposals are stored under the owner itinerary by the backend. The `I_AM_TIRED` Website flow requests destination time/timezone, reviews server changes, explicitly accepts, and renders an acknowledged owner refresh. Retry IDs and payloads stay stable after ambiguous responses. A historical saved receipt confirms an operation even when another replan has advanced the itinerary.
- Atomic acceptance preserves completed/skipped activities and protected booking/must-do data, uses immutable activity IDs and actual display day numbers, rejects stale proposals, and keeps revision/receipt history. Terminal journeys reject new replans and starts; receipt replays remain available.
- Normal saves are private. Explicit share transactions publish only a sanitized projection, bind it to the owner itinerary, reuse an existing acknowledged share, and keep ownership immutable. Unshare atomically removes the projection and owner binding and confirms removal. Public links are view-only; anonymous/collaborator writes are denied.
- History reads preserve separate document/operation IDs even for identical destinations and dates. They do not deduplicate or delete trips. Passport displays saved owner journeys separately from earned records. Transport failures stay errors rather than empty archives. The obsolete non-atomic completion-award function is unavailable.
- Website starts and cancellations wait for owner-write acknowledgment. Cancelling is a terminal `cancelled` state, not an earned completed visit. An existing active journey is not silently ended to start another.

## Compatibility and authority

Private authority remains `users/{uid}/itineraries/{id}`. Public projections are `itineraries/{shareId}`. Firestore proposal documents are owner-readable and backend-writable; client writes are denied by the revised rules. The checked-in rules were deployed to `naviigo-firebase/naviigo-db` on 14 October 2026 and read back through the Rules API; their content matches the reviewed file. Release ruleset: `222e174a-a0fe-42ac-8950-c3ccb48b9095`. The previous ruleset `5e68b0b1-e71d-470a-b1c8-31420c1c5a41` and source are preserved locally for rollback.

Old ownerless, private, malformed or markerless public-root records fail closed. An owner must explicitly publish a fresh sanitized share; this change does not bulk-migrate, delete or expose legacy documents. Public snapshots are refreshed only by an explicit owner share action. Guest publication and unscoped collaborative editing are unsupported.

Old name-only/ambiguous activity identities or missing saved revisions cannot safely replan. There is no positional/name migration by guesswork. Manual progress and client-controlled Passport XP are traveller reports, not independent physical-visit verification. No completion-award, journal, upload or social backend was added.

## Verification

- Backend: full `pytest` suite, **124 passed**; two dependency deprecation warnings, no failing tests.
- Website contracts: `npm test`, **38 passed**, exercising the actual TypeScript helpers/proxies and account-switch, receipts, retries, sharing, history, terminal and failure boundaries.
- Firestore: `npm run test:rules`, **11 passed** with the official emulator and the actual checked-in rules. Fixtures use synthetic accounts and a loopback `demo-naviigo-phase6` project. Tests load the same generic database rules into emulator `(default)`; deployed named-database configuration is not a live verification.
- TypeScript, lint with zero warnings and production build passed. Sentry upload credentials were cleared for the local build; no deployment occurred.
- `git diff --check` passed.
- Next.js is patched to the 16.3.8 line. Compatible dependency updates and a patched `@grpc/grpc-js` override avoid a forced Firebase major downgrade. The final production dependency audit (`npm audit --omit=dev`) reports zero known vulnerabilities; dev-tool advisories are separate, and this is not a security certification.

## Rollout checks still required

A live proposal smoke test exposed an unnecessary destination-provider dependency
in the tired replan route. Independent source review confirmed that the supported
engine never consumes that data. The route now builds from the authoritative
owner itinerary directly; a regression makes any unused provider call fail and
verifies proposal creation plus protected-booking acceptance. Generation and
discovery provider integration are outside this narrow follow-up.

Two independent release reviewers checked the Website/backend and mobile changes. Their concrete findings were fixed with regressions: the Website generation callback now extracts the confirmed owner's nested generated payload; protected must-do stops remain acceptable when no safe later day exists; acceptance replay binds the submitted base revision. Mobile Passport streams and memory dialogs reject cross-account retained data, progress reconciles only by surviving activity IDs, and historical receipt recovery validates its base revision. A separate read-only cross-review found no blocker in the Website callback fix. These bounded source reviews and mocked regression tests do not replace deployed/device validation.

Before production release, validate native Firebase account switching and token claims, deployed backend bearer attribution and transaction permissions, named `naviigo-db` configuration, provider failures/timezones, network-loss recovery and cross-platform acceptance/history on a real device and browser. Review and deploy backend, client and rules as a coordinated release. Changing rules before compatibility review can disable old public links.

Production Firestore rules deployment is verified as described above. Website/backend merge and deployment status are tracked separately in the release report. No live-user private-data queries, bulk migration, forced push, credential revocation/rotation, billing change or later product phase was performed. The existing Windows Firebase sign-in was refreshed through its normal OAuth flow.
