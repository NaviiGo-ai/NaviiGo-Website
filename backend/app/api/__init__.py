# ─── New-architecture API package ────────────────────────────────────────────
# These routers mount the transactional product layer (trips, bookings,
# payments, suppliers) on the modular monolith. The legacy routers in
# backend/routers/ continue to serve discovery/AI content.
