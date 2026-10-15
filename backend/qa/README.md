# Pilot research corpus and review runner

The seven user-supplied workbooks are now usable as an offline QA corpus:
478 scenarios, 51 traveler profiles and 90 research place references. Every
record retains its source workbook, sheet, row, file hash and original fields.
The original workbooks were not modified. Original source URLs are retained as
research citations; current timings, access, contacts and prices are not verified.

## Run

From `backend`, using the project's Python environment:

```powershell
python qa/run_pilot.py --limit 0 --output pilot_review.csv
python qa/run_pilot.py --region Dehradun --priority P0 --limit 5 --output dehradun_review.csv
```

Default mode validates the corpus and exports a manual evaluation sheet. It
makes no network requests, spends no model tokens and changes no app records.
The export has expected behavior, forbidden behavior, live checks and empty
review columns. Start with P0 booking trust, access/safety and route feasibility.

434 cases have supplied prompts and rubrics. The 44 Ujjain cases do not supply
these fields or a priority; they remain `needs_rubric`, not inferred test passes.
Preserve sourced versus estimated budgets and unknown group sizes as written.

Optional reply capture against a local running backend:

```powershell
python qa/run_pilot.py --region Dehradun --priority P0 --limit 5 --chat-url http://127.0.0.1:8000/api/chat/ --output captured_review.csv
```

Remote capture additionally requires HTTPS and `--allow-remote`; this can incur
model costs. If authentication is required, provide `NAVII_QA_TOKEN` through the
environment, never in a committed file. Returned actions are recorded but never
executed. A 200 response, demo reply or captured reply is **not** a semantic pass.
A reviewer must check expected/forbidden behavior and current source evidence.
This chat runner does not test generated itineraries, native UI, bookings or
all device flows: use the same cases in the appropriate app screens too.

## Place approval boundary

`place_review_queue.csv` contains 89 Unreviewed research references and one
explicitly Excluded reference. These include areas, trails, events and religious
sites; they are not all businesses. None is publishable. No contacts, owners or
approvals were invented. The separate partner approval workbook is still pending.

Do not wire these files directly into production recommendations or guide
listings. Reconcile the future approval workbook using a stable partner ID,
verified address/location and reviewed source; never approve on name alone.
Review contact identity, access, suitability and permission before publishing.
An Excel approval cell by itself is not an authorization mechanism.

## Wallet pilot boundary

```powershell
python -m pytest tests/test_wallet_pilot.py -q
```

These tests use in-memory SQLite and mock all Firestore synchronization. They
seed INR 1,000 only in the temporary fixture, debit INR 250, replay without a
second debit, refund INR 250 and replay without a second credit. They also check
owner isolation, mismatched retry payloads, insufficient funds, locked accounts
and nonpositive amounts. They do not use Razorpay or a live user's balance.

Public `/api/wallet/debit` and `/api/wallet/refund` now return typed 503 errors.
They previously trusted a client amount/reference without an authoritative
booking/cancellation. Keep them unavailable until that trusted orchestration
exists. Read account/history and coupon validation remain available.

Internal ledger functions are not a complete production payment system. Before
enabling checkout, implement server-owned booking amounts, verified cancellation
and refundable limits, a durable post-commit Firestore projection, transactional
outbox/reconciliation, and PostgreSQL concurrency tests. SQLite does not prove
row-lock or concurrent idempotency behavior. Razorpay keys alone do not implement
wallet top-ups or enable wallet checkout in the app.
