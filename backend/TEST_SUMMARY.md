All tests passing (30/30)

Fixed:
1. Production SSRF guard: added literal-IP check to block redirects to private IPs
2. AI engine: corrected metadata field name (metadata_json → metadata) in mutation payload
3. Trip service: _pref_dict now accepts dict from model_dump(exclude_unset=True)
4. Trip undo: preserve snapshot row for audit instead of deleting it
5. Security tests: added missing httpx import
6. Security tests: deterministic DNS mocking for safe URLs
7. Booking tests: fixed offer_id comparison bug
8. Payment tests: replaced broken MagicMock supplier with concrete namespace objects
9. Trip tests: added missing item_type fields to TripItemIn constructions
10. SSRF test markers: moved asyncio marker to per-function level
11. Database base: replaced deprecated datetime.utcnow with timezone-aware lambda
12. Added pyproject.toml to configure pytest-asyncio
