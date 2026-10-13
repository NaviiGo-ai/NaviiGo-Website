# Phase 6 contract packet

This is the shared Website/backend/mobile interface for Phase 6. It is frozen
before implementation; compatible changes must update this document and the
mobile copy together. The packet does not authorize production deployment or
data migration.

## Authority and identity

- Verified Firebase bearer UID is the only owner authority. Body `userId` and
  client-provided owner fields are informational and never authorize a write.
- The canonical owner resource is
  `users/{ownerUid}/itineraries/{itineraryId}`.
- One logical generation operation has one caller-supplied `operationId` (UUID
  v4), used as the owner document ID and idempotency key. A retry with the same
  owner and operation ID replays the original receipt; a different request
  fingerprint returns `409 IDEMPOTENCY_CONFLICT`.
- New generated activities receive immutable opaque `activityId` values before
  persistence. Titles, place IDs, day numbers and array positions are never
  mutation identity. Legacy ambiguous activities remain unavailable to replan.
- Day numbers are display identities. The server preserves both list order and
  the supplied numeric `dayNumber`; no consumer calculates `dayNumber - 1`.

## Generation

`POST /api/itinerary/generate` requires a Firebase bearer token and accepts the
existing request fields plus `operationId` (or `Idempotency-Key` as an equivalent
header). `days` is `1..14`; `budget: 0`, explicit empty maps/lists, `false`, and
`null` optionals are preserved. Server defaults are applied only when a field is
absent, and the persisted `form` records the caller input separately from any
effective generation context.

Success is only durable when the owner write is acknowledged:

```json
{
  "success": true,
  "userId": "verified-firebase-uid",
  "itinerary": { "id": "operation-id", "userId": "verified-firebase-uid" },
  "persistence": { "status": "saved", "durable": true, "replayed": false },
  "receipt": {
    "operationId": "operation-id",
    "itineraryId": "operation-id",
    "ownerUid": "verified-firebase-uid",
    "revisionId": "rev_0",
    "status": "committed"
  }
}
```

Generation failures before persistence remain typed failures. An ambiguous
transport outcome is never reported as saved; the client retries or reconciles
using the same operation ID. A successful preview without a receipt is
explicitly unsaved and cannot enter durable history, Passport, sharing or live
journey state.

## Replanning

Supported reason in this phase: `I_AM_TIRED`. Unsupported reasons are rejected
with `422 REPLAN_VALIDATION_ERROR` rather than silently using a default.

`POST /api/itinerary/replan`:

```json
{
  "itineraryId": "operation-id",
  "operationId": "replan-operation-id",
  "baseRevisionId": "rev_0",
  "currentDayNumber": 9,
  "currentTime": "15:00",
  "reason": "I_AM_TIRED",
  "completedActivityIds": ["activity-a"],
  "skippedActivityIds": ["activity-b"],
  "location": { "lat": 26.9, "lng": 75.8 },
  "destinationTimezone": "Asia/Kolkata"
}
```

The server reads the owner itinerary and stores the server-owned proposal at
`users/{uid}/itineraries/{itineraryId}/proposals/{proposalId}`. Proposal review
does not mutate the itinerary. Completed/skipped activities and protected
booking/must-do fields remain represented and are never reconstructed solely
from generated actions.

`POST /api/itinerary/replan/accept` accepts only `itineraryId`, `proposalId`,
`baseRevisionId`, and an idempotent `operationId`. Client `proposalData` is not
mutation authority. Acceptance atomically verifies owner, proposal, itinerary,
base revision and admissible actions. It returns the authoritative updated
itinerary and:

```json
{
  "status": "accepted",
  "receipt": {
    "ownerUid": "verified-firebase-uid",
    "itineraryId": "operation-id",
    "proposalId": "proposal-id",
    "operationId": "accept-operation-id",
    "previousRevisionId": "rev_0",
    "revisionId": "rev_1",
    "idempotent": false
  }
}
```

Repeating the same proposal returns its original receipt and current
authoritative itinerary without applying the mutation again. A competing base
revision returns `409 STALE_PROPOSAL`. Other stable errors are `401
AUTH_REQUIRED`, `403 FORBIDDEN`, `404 ITINERARY_NOT_FOUND`/
`PROPOSAL_NOT_FOUND`, `409 INVALID_STATE`/`ACTIVITY_IDENTITY_AMBIGUOUS`/`TRIP_TERMINAL`, `422
REPLAN_VALIDATION_ERROR`, `503 REPLAN_PROVIDER_UNAVAILABLE`, and `500
INTERNAL_ERROR` only for unexpected failures.

## Sharing and return data

- Owner itineraries are private by default and are read from the owner path.
- A public `itineraries/{shareId}` document is a sanitized, explicit share
  projection only. It is created by an explicit share action and contains no
  private form preferences, browsing signals, logistics, owner-only metadata or
  write authority.
- Unshare removes or disables only the public projection and reports the actual
  result. Unknown/ownerless legacy projections are read-only or unavailable.
- History and Passport use owner-scoped data. `status: completed` is the primary
  completed-history authority; date-derived classification is legacy fallback
  only. `cancelled` is terminal but not completed.
- Passport awards remain traveller-reported (`verificationMethod:
  itinerary_complete`) unless an independently verified server contract exists.
  The mobile memory action uses an owner-scoped deterministic trip/note key
  and one entry/stats transaction; it does not independently verify a visit.
  Website completion awards are unavailable: the old non-atomic two-write
  function fails visibly. No new completion/verified-award endpoint is defined.

## Mobile integration gate

Mobile accepts a generated itinerary as durable only after validating the receipt
against the initiating UID, fetching the owner document by `itineraryId`, and
verifying owner and `revisionId`. Replan request/review/accept state is bound to
`{uid, itineraryId, operationId, baseRevisionId}`. After acceptance mobile reads
the owner document authoritatively, invalidates list/detail providers, and
reconciles manual check-ins only by stable `activityId`; positional legacy
records are never guessed onto new activities.
