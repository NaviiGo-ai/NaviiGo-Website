# 🧭 NaviiGo — Project Plans

> **Purpose:** This file contains all current and future plans for NaviiGo. Each plan includes scope, priority, dependencies, and estimated effort. Plans are organized by priority and phase.
>
> **Last Updated:** 2026-08-11

---

## 📌 How to Use This File
- Plans flow from `discussed_ideas.md` → here → `todo.md` (during execution) → `implemented.md` (when done)
- Each plan should have: Priority, Scope, Dependencies, Estimated Effort, Status
- Status: `📋 Planned` → `🚧 In Progress` → `✅ Complete`
- Add new plans from future discussions at the bottom of the relevant section

---

## 🔴 Phase 1: Foundation (COMPLETE)

> Core platform built and operational.

### Plan 1.1: Next.js + FastAPI Dual-Stack Setup ✅
- **Priority:** P0 — Critical
- **Scope:** Next.js 16 frontend with App Router, FastAPI backend with Gemini integration
- **Dependencies:** Node.js 18+, Python 3.10+, Firebase project, Gemini API key
- **Effort:** 2-3 weeks
- **Status:** ✅ Complete

### Plan 1.2: AI Itinerary Generation Pipeline ✅
- **Priority:** P0 — Critical
- **Scope:**
  - Multi-layer destination data cache (Memory → File → CSV → Gemini)
  - Deterministic personalization engine (scoring-based, 590+ lines)
  - Purpose-tag affinity scoring, group preferences, budget tiers
  - 6 traveler pace profiles (backpacker, comfort, luxury, family, flash, slow)
  - Time-slot scheduling with travel time estimation
- **Dependencies:** Gemini API, destination CSV data
- **Effort:** 3-4 weeks
- **Status:** ✅ Complete

### Plan 1.3: Firebase Integration ✅
- **Priority:** P0 — Critical
- **Scope:**
  - Google Auth with profile upsert
  - Firestore CRUD for all collections (users, bookings, itineraries, tracking, passport, personalization, reviews, leaderboard)
  - Security rules with per-user isolation
  - UUID-based public itinerary sharing
- **Dependencies:** Firebase project with Auth + Firestore enabled
- **Effort:** 2 weeks
- **Status:** ✅ Complete

### Plan 1.4: Core UI Pages ✅
- **Priority:** P0 — Critical
- **Scope:**
  - Home page (hero slider, GSAP scroll, stats, features, destinations, testimonials, CTA)
  - Itinerary wizard (SetupWizard → LoadingScreen → ResultPage → DayViewPage)
  - Explore page (destination grid + deep-dive per destination)
  - Bookings page (flights, trains, cabs, hotels search)
  - Passport page (stamps, achievements, leaderboard)
  - Saved itineraries page
  - About, Support, Privacy, Terms pages
  - 404 / Error / Loading / Offline pages
- **Dependencies:** All backend APIs operational
- **Effort:** 4-5 weeks
- **Status:** ✅ Complete

---

## 🟡 Phase 2: Intelligence & Engagement (COMPLETE)

> AI-powered personalization and gamification layer.

### Plan 2.1: AI Chat + Itinerary Editing ✅
- **Priority:** P1 — High
- **Scope:**
  - Gemini-powered chat assistant with itinerary context
  - 8 structured action types (remove, add, replace, reorder, addDay, changeHotel, swapRestaurant, surpriseActivity)
  - AIContext provider with state management
  - Inline edit panel on itinerary page
- **Dependencies:** Gemini API, itinerary data model
- **Effort:** 2 weeks
- **Status:** ✅ Complete

### Plan 2.2: Browsing Signals + Personalization ✅
- **Priority:** P1 — High
- **Scope:**
  - LocalStorage-based signal collection (time on city, categories, vibes, viewed destinations)
  - Debounced Firestore sync for cross-device
  - Firestore ↔ localStorage merge logic (newer wins)
  - Signals feed into itinerary scoring engine
- **Dependencies:** Firebase Auth, Firestore
- **Effort:** 1 week
- **Status:** ✅ Complete

### Plan 2.3: Taste Profiling + Recommendations ✅
- **Priority:** P1 — High
- **Scope:**
  - Gemini text embeddings for user interests
  - Pinecone vector search for semantic destination matching
  - Multi-signal scoring (season, purpose, budget, group, interests, vector similarity, browsing)
  - Cached Gemini pitch lines per recommendation set
- **Dependencies:** Gemini API, Pinecone (optional)
- **Effort:** 2 weeks
- **Status:** ✅ Complete

### Plan 2.4: Digital Passport + Gamification ✅
- **Priority:** P1 — High
- **Scope:**
  - XP system: base + per-activity + day bonus + streak bonus - return visit penalty
  - Level progression: sqrt(totalXP/100), 8 level titles
  - 18 achievements across 4 categories
  - Stamp celebration animations
  - Streak tracking (14-day window)
  - Leaderboard (global top 20 + user rank)
  - Trip checkpoint system with localStorage persistence
- **Dependencies:** Firestore (passport, stamps, leaderboard collections)
- **Effort:** 2-3 weeks
- **Status:** ✅ Complete

### Plan 2.5: Social Link → Itinerary ✅
- **Priority:** P2 — Medium
- **Scope:**
  - URL metadata extraction (OG tags)
  - Gemini content analysis for travel info extraction
  - Auto-fill itinerary wizard from extracted data
  - Content hash-based caching (72h TTL)
- **Dependencies:** Gemini API, httpx
- **Effort:** 1 week
- **Status:** ✅ Complete

### Plan 2.6: Deep Dive Engine ✅
- **Priority:** P2 — Medium
- **Scope:**
  - Reddit-consensus style destination insights
  - Hidden gems, tourist traps, Instagram spots, local food
  - Companion + vibe parameterized generation
  - Cached 48 hours per (destination, companion, vibe) combo
- **Dependencies:** Gemini API
- **Effort:** 1 week
- **Status:** ✅ Complete

---

## 🟢 Phase 3: Booking & Monetization (COMPLETE)

### Plan 3.1: Multi-Platform Booking Search ✅
- **Priority:** P1 — High
- **Scope:**
  - Flights: SerpAPI Google Flights with mock fallback, Google Flights deep links
  - Hotels: SerpAPI Google Hotels with mock fallback, Booking.com deep links
  - Trains: Mock corpus (10 train types) with Cleartrip/IRCTC deep links
  - Cabs: Ola/Uber with fare estimation, deep links
  - City code mapping (50+ Indian cities with IATA + station codes)
  - Pagination support for flights/hotels
- **Dependencies:** SerpAPI key (optional), Google Flights/Hotels for deep links
- **Effort:** 2-3 weeks
- **Status:** ✅ Complete

### Plan 3.2: Transport Between Activities ✅
- **Priority:** P2 — Medium
- **Scope:**
  - Haversine distance calculation between consecutive activities
  - Fare estimation (Auto, Ola, Uber) based on Indian city rates
  - Deep links to ride-hailing apps with pre-filled coordinates
  - Auto-rickshaw shown only for <15km distances
- **Dependencies:** Lat/lng data in itinerary activities
- **Effort:** 3 days
- **Status:** ✅ Complete

### Plan 3.3: TravelPayouts Affiliate ✅
- **Priority:** P3 — Low
- **Scope:** White-label widget integration on deals page
- **Dependencies:** TravelPayouts partner account
- **Effort:** 1 day
- **Status:** ✅ Complete

---

## 🔵 Phase 4: Production Hardening (COMPLETE)

### Plan 4.1: Security Hardening ✅
- **Priority:** P0 — Critical
- **Scope:**
  - CSP headers (script, style, connect, img, frame sources whitelisted)
  - HSTS with preload (2-year max-age)
  - X-Frame-Options, X-XSS-Protection, Referrer-Policy
  - Geolocation permission-only policy
  - Rate limiting (SlowAPI backend + frontend IP-based)
  - Prompt injection prevention (message truncation at 1000 chars)
  - Firestore security rules
- **Effort:** 1 week
- **Status:** ✅ Complete

### Plan 4.2: Error Tracking & Monitoring ✅
- **Priority:** P1 — High
- **Scope:** Sentry integration (client, server, edge configs)
- **Dependencies:** Sentry account + DSN
- **Effort:** 2 days
- **Status:** ✅ Complete

### Plan 4.3: PWA & Offline ✅
- **Priority:** P2 — Medium
- **Scope:** Service worker, manifest, offline page
- **Effort:** 2 days
- **Status:** ✅ Complete

### Plan 4.4: SEO & Metadata ✅
- **Priority:** P2 — Medium
- **Scope:** OG tags, Twitter cards, sitemap, robots.txt, structured metadata, OpenGraph image generation
- **Effort:** 2 days
- **Status:** ✅ Complete

---

## 🟣 Phase 5: Future Plans

> Plans below are for upcoming features. Add new plans from discussions here.

### Plan 5.1: Multi-City / Circuit Itineraries
- **Priority:** P1 — High
- **Scope:**
  - Support itineraries spanning 2-4 cities
  - Inter-city transport recommendations (flights, trains)
  - Circuit templates (Golden Triangle, South India Temple Circuit, etc.)
  - Day allocation across cities
- **Dependencies:** Enhanced itinerary model, inter-city transport data
- **Effort:** 3-4 weeks
- **Status:** 📋 Planned

### Plan 5.2: Group Trip Collaboration
- **Priority:** P2 — Medium
- **Scope:**
  - Real-time collaborative itinerary editing via Firestore listeners
  - Activity voting system
  - Shared expense tracking
  - Group chat within the itinerary
- **Dependencies:** Firestore real-time listeners, enhanced sharing model
- **Effort:** 4-5 weeks
- **Status:** 📋 Planned

### Plan 5.3: Real-Time Crowd & Weather Intelligence
- **Priority:** P2 — Medium
- **Scope:**
  - Live crowd predictions using Google Popular Times
  - Weather-based activity rescheduling
  - Rain/heat alerts with automatic indoor alternatives
- **Dependencies:** Google Places API, Open-Meteo API
- **Effort:** 2-3 weeks
- **Status:** 📋 Planned

### Plan 5.4: Photo Journal & Trip Diary
- **Priority:** P3 — Low
- **Scope:**
  - Upload photos at each checkpoint
  - Auto-generate shareable trip diary
  - Social sharing to Instagram/WhatsApp
- **Dependencies:** Firebase Storage, image processing
- **Effort:** 3 weeks
- **Status:** 📋 Planned

### Plan 5.5: AI Voice Assistant
- **Priority:** P3 — Low
- **Scope:**
  - Web Speech API for voice input
  - Gemini-powered voice responses
  - Hands-free navigation during trips
- **Dependencies:** Web Speech API, enhanced Gemini chat
- **Effort:** 3-4 weeks
- **Status:** 📋 Planned

### Plan 5.6: Local Guide Marketplace
- **Priority:** P3 — Low
- **Scope:**
  - Guide profiles with ratings and specialties
  - Booking interface for guided tours
  - Revenue share model
- **Dependencies:** Payment integration, guide verification system
- **Effort:** 6-8 weeks
- **Status:** 📋 Planned

### Plan 5.7: Expense Tracker
- **Priority:** P2 — Medium
- **Scope:**
  - In-trip spending log with categories
  - Group expense splitting
  - Budget vs actual comparison
  - Export to CSV/PDF
- **Dependencies:** Firestore, currency formatting
- **Effort:** 2-3 weeks
- **Status:** 📋 Planned

### Plan 5.8: Emergency SOS Feature
- **Priority:** P2 — Medium
- **Scope:**
  - One-tap SOS with GPS location sharing
  - Emergency contacts management
  - Local police/hospital/embassy info per destination
- **Dependencies:** Geolocation API, SMS/notification service
- **Effort:** 2 weeks
- **Status:** 📋 Planned

### Plan 5.9: Accessibility Improvements
- **Priority:** P2 — Medium
- **Scope:**
  - Wheelchair accessibility ratings
  - Elderly-friendly route optimization
  - Screen reader support (ARIA labels)
  - Audio descriptions for landmarks
- **Dependencies:** Accessibility data for destinations
- **Effort:** 3 weeks
- **Status:** 📋 Planned

### Plan 5.10: Language Translation Layer
- **Priority:** P3 — Low
- **Scope:**
  - Key phrases in local languages per destination
  - In-app camera translation for menus/signs
  - Multi-language UI support (Hindi, Tamil, etc.)
- **Dependencies:** Google Translate API or Gemini translation
- **Effort:** 3-4 weeks
- **Status:** 📋 Planned

---

## 📊 Priority Legend

| Priority | Meaning |
|----------|---------|
| **P0** | Critical — Must have, blocks launch |
| **P1** | High — Core feature, high user impact |
| **P2** | Medium — Important enhancement |
| **P3** | Low — Nice-to-have, can defer |

---

## 📅 Upcoming Planning Sessions

| Date | Focus Area | Notes |
|------|-----------|-------|
| TBD | Phase 5 feature prioritization | Review future plans, pick next sprint |
| TBD | Performance audit | Lighthouse scores, bundle size, API latency |
| TBD | User feedback review | Analyze user behavior data, adjust roadmap |

---

> **Note:** This is a living document. Update it during every planning session. All new plans discussed should be added here before moving to `todo.md`.
