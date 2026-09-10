# 🧭 NaviiGo — Implemented Features

> **Purpose:** Complete record of all features, code functionalities, and systems that are implemented and working in the NaviiGo platform. This serves as the source of truth for what's live.
>
> **Last Updated:** 2026-08-16 (Branch: `kartikey-reviewed`)

---

## 🚀 Branch `kartikey-reviewed` — Audit, Security & Modularization Log (2026-08-16)

All 14 atomic commits executed, verified, and live on branch `kartikey-reviewed`:

1. `9f57a0a` — `fix(backend): resolve proxy IP rate-limiting between Next.js & FastAPI`
   - Fixed `SlowAPI` client IP detection by extracting `X-Forwarded-For` headers in `backend/limiter.py` and adding `getProxyHeaders()` in `lib/rateLimit.ts`.
2. `a3e887f` — `fix(ux): eliminate window reloads & secure local/session storage calls`
   - Created `lib/utils/storage.ts` safe storage utility handling `QuotaExceededError` and private browsing; replaced `window.location.href` in `app/passport/page.tsx` with Next.js `useRouter().push()`.
3. `567ee43` — `fix(ui): add defensive rendering, crash guards & error boundary wrappers`
   - Added React `ErrorBoundary` wrapper, optional chaining on array maps in `explore/[destId]/page.tsx`, and numeric coordinate validation in `ItineraryMap.tsx`.
4. `c40b386` — `fix(perf): add AbortController on async fetches & HTTP cache headers`
   - Implemented `AbortController` signal in destination deep dive and events fetching; added HTTP `Cache-Control` headers to search proxy API.
5. `300f8dc` — `fix(seo): configure title template, dynamic route metadata & env fallbacks`
   - Added `title.template` (`%s | NaviiGo`) in `app/layout.tsx` and validated production `NEXT_PUBLIC_PYTHON_API_URL`.
6. `80c1104` — `refactor(types): establish centralized TypeScript interface definitions`
   - Built `@/types` domain directory (`api.ts`, `booking.ts`, `itinerary.ts`, `explore.ts`, `passport.ts`, `index.ts`) and removed explicit `any` types.
7. `3d2e7c1` — `refactor(data): consolidate destination data into Master Destination Registry`
   - Created `lib/constants/destinations.ts` as the single authoritative destination and IATA/station code registry.
8. `86305a2` — `refactor(backend): modularize FastAPI services & remove client AI prompt duplication`
   - Extracted prompt construction logic into `backend/services/prompt_builder.py`.
9. `43b3bf8` — `refactor(bookings): decompose monolithic booking page into feature components`
   - Extracted `BookingTabs`, `FlightCard`, `TrainCard`, `CabCard`, `HotelCard`, `FilterChips`, `SortBar` components in `components/features/bookings/`.
10. `aa7f674` — `refactor(explore, passport): decompose monoliths & optimize image assets`
    - Extracted `ExploreHero`, `BentoGrid`, `CuisineSection`, `PassportHeader`, `StampGrid`, `Leaderboard` components.
11. `abec83e` — `feat(hooks): introduce custom data fetching hooks with SWR client caching`
    - Built `useDeepDive`, `useEvents`, `useSearchResults` hooks with in-memory caching.
12. `70dfeff` — `refactor: integrate modular subcomponents across bookings, explore & passport pages`
    - Integrated feature subcomponents directly into `app/bookings/page.tsx`, `app/explore/page.tsx`, and `app/passport/page.tsx`.
13. `774ef2d` — `fix(itinerary): restore customPlans state definition in DayViewPage.tsx`
    - Resolved `customPlans is not defined` runtime error in `components/features/itinerary/DayViewPage.tsx`.
14. `3359c5c` — `fix(explore): import useMemo hook in app/explore/page.tsx`
    - Resolved `useMemo is not defined` runtime error in `app/explore/page.tsx`.

---

## 📌 How to Use This File
- Every implemented feature should be documented here with:
  - What it does
  - Key files involved
  - How it works (technical summary)
  - APIs/endpoints used
- Update this file whenever a feature goes from `todo.md` → complete

---

## 🏗️ Architecture & Infrastructure

### 1. Next.js 16 Frontend (App Router)
- **What:** Full React 19 + TypeScript frontend using Next.js App Router
- **Key Files:**
  - `app/layout.tsx` — Root layout with providers, fonts, Navbar, Footer
  - `app/providers.tsx` — Theme + AI providers
  - `app/page.tsx` — Landing page
  - `next.config.js` — Config with Sentry, image remotes, security headers
  - `tailwind.config.ts` — Tailwind CSS configuration
- **Tech:** Next.js 16, React 19, TypeScript, TailwindCSS 3, Framer Motion, GSAP, Lucide Icons
- **How it works:** App Router with file-based routing. API routes in `app/api/*` proxy to the Python backend. Server components where possible, client components for interactive UI.

### 2. FastAPI Python Backend
- **What:** AI engine backend powering itinerary generation, chat, recommendations, explore, weather, transport, taste profiling, and places
- **Key Files:**
  - `backend/main.py` — FastAPI entry point with CORS, rate limiting, router registration
  - `backend/routers/` — 9 API router modules
  - `backend/services/` — 17 service modules (AI engines, caching, data)
  - `backend/requirements.txt` — Python dependencies
  - `backend/test_all.py` — Pytest test suite
- **Tech:** FastAPI, Pydantic, Google GenAI (Gemini), Pinecone, Redis (optional), SlowAPI
- **Endpoints registered:**
  - `POST /api/itinerary/generate` — Generate itinerary (5/min rate limit)
  - `POST /api/itinerary/from-link` — Extract travel info from URL/caption (10/min)
  - `POST /api/chat` — AI chat with itinerary context
  - `GET /api/recommendations` — Personalized destination recommendations
  - `GET /api/explore/deep-dive` — Deep dive insights for a destination
  - `GET /api/explore/events` — Live events for a destination
  - `GET /api/weather` — Weather data
  - `GET /api/transport` — Transport options
  - `POST /api/taste/update` — Update taste vector
  - `GET /api/places/autocomplete` — Place autocomplete
  - `GET /api/places/details` — Place details
  - `GET /api/admin/cache/stats` — Cache statistics

### 3. Multi-Layer Caching System
- **What:** 4-layer cache for destination data ensuring minimal API calls
- **Key Files:**
  - `backend/services/destination_cache.py` — LRU memory, file cache, CSV loader, Gemini fallback
  - `backend/services/gemini_cache.py` — Redis-based Gemini response caching with file fallback
  - `backend/cache/destinations/` — File-based cache storage
  - `backend/data/` — CSV/JSON bulk destination data
- **How it works:**
  1. **Layer 1 — Memory LRU:** In-process OrderedDict, max 200 entries, 24h TTL
  2. **Layer 2 — File Cache:** JSON files in `backend/cache/destinations/`, 24h TTL
  3. **Layer 3 — CSV/Bulk:** Preloaded from `backend/data/` on startup
  4. **Layer 4 — Gemini API:** Last resort, results written through to all layers
- **Stats endpoint:** `GET /api/admin/cache/stats`

### 4. Firebase & Firestore Data Persistence
- **What:** Cloud persistence layer for user itineraries, passports, and public shared itineraries
- **Key Files:**
  - `lib/firebase.ts` — Firebase App & named Firestore database initialization (`naviigo-db`)
  - `lib/firestore.ts` — Helper methods: `saveItineraryByUUID`, `getItineraryByUUID`, `saveItineraryToFirestore`, `getUserItineraries`, `deleteItineraryFromFirestore`
  - `firestore.rules` — Security rules allowing public read + unauthenticated create on `itineraries/{uuid}` (guests & auth users) and auth-only user collections (`users/{uid}/*`)
  - `components/features/itinerary/LoadingScreen.tsx` — Client-side Firestore persistence upon itinerary generation finish
  - `app/saved/page.tsx` — Saved trips view linking directly to `/itinerary/{uuid}`
- **How it works:**
  1. Generation finishes in browser -> `LoadingScreen.tsx` calls `saveItineraryByUUID(saveUUID, ...)` with active user session / guest context.
  2. Saving from `ResultPage` or `DayViewPage` stores `_uuid` in the document within `users/{uid}/itineraries`.
  3. `Saved` page accesses `_uuid` to open `/itinerary/{uuid}` directly.

---

## 🧠 AI & Intelligence Features

### 4. AI Itinerary Generation (Deterministic Engine)
- **What:** Scoring-based itinerary builder that creates personalized day-by-day plans
- **Key Files:**
  - `backend/services/itinerary_model.py` — 590-line deterministic engine (Python)
  - `lib/ai/itineraryModel.ts` — 793-line TypeScript equivalent
  - `backend/routers/itinerary.py` — API router with Firestore save
  - `backend/services/itinerary_engine.py` — Gemini data fetching
- **How it works:**
  - **Input:** Destination, purpose, group, days, budget, traveler type, preferences, browsing signals, and **Travel Logistics** (`arrivalTime`, `arrivalMode`, `departureTime`, `departureMode`, `hotelArea`, `originCity`, `mustDo` pinned activities)
  - **Scoring Engine:** Each attraction scored on: purpose-tag alignment (40pts max), group-walk fit (±20pts), budget tier (±10pts), browsing signals (up to +37pts), user interests (+15pts), past trip penalty (-5pts), date/month fit (+10pts)
  - **Scheduling:** Uses traveler pace profiles (6 types) to determine wake time, activities per slot, lunch/rest breaks. Takes into account arrival/departure timings and transport modes to schedule day 1 and final day accurately.
  - **Travel Time:** Haversine distance → estimated travel overhead between activities
  - **Output:** Complete itinerary with dayPlans, scored attractions, restaurants, hotels, weather, crowd tips, logistics awareness

### 5. AI Chat Assistant
- **What:** Gemini-powered travel assistant that can answer questions AND edit itineraries
- **Key Files:**
  - `backend/services/chat_engine.py` — Gemini chat with structured action output
  - `backend/routers/chat.py` — Chat API router
  - `context/AIContext.tsx` — React context managing chat state + itinerary mutations
  - `app/api/chat/route.ts` — Next.js API proxy
- **Supported Actions:**
  - `removeActivity` — Remove an activity from a specific day
  - `addActivity` — Add a new activity with time/slot
  - `replaceActivity` — Replace an existing activity
  - `reorderDay` — Reorder activities within a day
  - `addDay` — Add an entirely new day to the itinerary
  - `changeHotel` — Replace a hotel recommendation
  - `swapRestaurant` — Replace a restaurant
  - `surpriseActivity` — Replace with a random hidden gem
- **Safety:** Message truncated at 1000 chars, context limited to last 5 messages

### 6. Social Link → Itinerary (From-Link Engine)
- **What:** Parse travel content from social media URLs or caption text into itinerary form data
- **Key Files:**
  - `backend/services/from_link_engine.py` — URL metadata extraction + Gemini analysis
  - `backend/routers/itinerary.py` — `/from-link` endpoint
  - `components/features/itinerary/BuildFromLink.tsx` — Frontend UI (13KB)
- **How it works:**
  1. Fetch Open Graph metadata from URL (title, description, image)
  2. Combine with caption text
  3. Send to Gemini to extract: destName, places, vibe, days, purpose, tags, confidence
  4. Cache by content MD5 hash (72h TTL)
  5. Auto-fill the itinerary wizard

### 7. Deep Dive Engine
- **What:** Authentic, Reddit-style destination insights
- **Key Files:**
  - `backend/services/deep_dive_engine.py` — Gemini generation + caching
  - `backend/routers/explore.py` — Deep dive + events endpoints
  - `app/explore/[destId]/page.tsx` — Deep dive UI
- **Output Structure:**
  - `redditConsensus` — What real travelers say
  - `hiddenGems` (3) — Secret local spots
  - `touristTrapsToAvoid` (2) — Overrated spots + better alternatives
  - `instagramWorthy` (3) — Photo spots with best times
  - `localFoodMustHaves` (3) — Dishes + specific restaurants
- **Caching:** 48h TTL per (destination, companion, vibe) combination

### 8. AI Recommendations Engine
- **What:** Personalized destination scoring across 15 Indian destinations
- **Key Files:**
  - `backend/services/recommendations_engine.py` — Multi-signal scoring
  - `backend/routers/recommendations.py` — API router
  - `components/features/itinerary/SmartRecommendations.tsx` — Frontend display
- **Scoring Factors:**
  - Season/month fit (+30 or -10)
  - Purpose alignment (+25 or -10)
  - Budget fit (+15 or -15)
  - Novelty boost (+10 for unvisited)
  - Group fit (+15)
  - User interests (+12)
  - Vector semantic match (up to +40)
- **Destinations covered:** Ladakh, Manali, Kerala, Goa, Jaipur, Varanasi, Rishikesh, Andaman, Darjeeling, Udaipur, Coorg, Hampi, Shimla, Amritsar, Gangtok

### 9. Taste Profiling (Vector Embeddings)
- **What:** Gemini text embeddings for user taste → Pinecone vector search
- **Key Files:**
  - `backend/services/embeddings_engine.py` — Gemini embedding generation
  - `backend/services/pinecone_engine.py` — Pinecone vector search
  - `backend/routers/taste.py` — Taste update endpoint
  - `lib/ai/embeddings.ts` — Frontend embedding client
  - `lib/ai/pinecone.ts` — Frontend Pinecone client
- **How it works:** User interests + browsing signals → text → Gemini embedding → Pinecone storage → semantic similarity search against destination vectors

### 10. Browsing Signal Collection
- **What:** Implicit user behavior tracking for personalization
- **Key Files:**
  - `lib/browsingSignals.ts` — Signal collector (localStorage + Firestore sync)
  - `lib/firestore.ts` — `savePersonalizationSignals()`, `getPersonalizationSignals()`
- **Signals Tracked:**
  - `timeOnCity` — Seconds spent viewing each destination
  - `clickedCategories` — Category pills clicked on Explore page
  - `deepDiveVibes` — Companion + vibe selections per destination
  - `viewedDestinations` — Ordered list of destinations clicked (last 30)
- **Sync:** Debounced (2s) Firestore write when user is signed in. Bidirectional merge on sign-in (newer wins).

---

## 🎮 Gamification System

### 11. Digital Passport
- **What:** Stamp collection system with XP, levels, achievements, and leaderboard
- **Key Files:**
  - `lib/gamification.ts` — XP/level/achievement logic (201 lines)
  - `lib/passportService.ts` — Trip completion → stamp award flow
  - `lib/leaderboard.ts` — Global leaderboard CRUD
  - `lib/useCheckpoints.ts` — In-trip progress tracking hook
  - `lib/firestore.ts` — Passport Firestore operations
  - `app/passport/page.tsx` — Passport UI (40KB)
  - `components/features/passport/StampCelebration.tsx` — Award animation
  - `components/features/passport/CheckpointToast.tsx` — Activity completion toast

### 12. XP & Level System
- **Formula:**
  - Base: 100 XP per trip
  - Activities: 25 XP per completed activity
  - Day bonus: 100 XP per fully completed day
  - Streak bonus: 50 XP if trip within 14 days of last
  - Return visit penalty: -50% if destination already visited
  - Minimum: 50 XP guaranteed
- **Levels:** `Math.floor(Math.sqrt(totalXP / 100))`
- **Level Titles:** Novice Traveler → Explorer → Adventurer → Seasoned Traveler → Globetrotter → Travel Master → Wanderlust Legend → Travel God 🏆

### 13. Achievement System (18 Achievements)
- **Categories:**
  - **Travel Milestones:** First Steps (1 trip), Frequent Flyer (5), Road Warrior (10), Wanderlust (20)
  - **Destination Types:** Beach Bum (3 beaches), Mountain Goat (3 mountains), Pilgrim (5 spiritual), History Buff (5 heritage)
  - **State Coverage:** Interstate Explorer (5 states), Pan-India Traveler (10), All-India Champion (15+)
  - **Streaks:** Hot Streak (3-week), On Fire (7-week)
  - **Levels:** Getting Started (Lv3), Rising Star (Lv5), Power Traveler (Lv10)
  - **Special:** Cultural Mosaic (all categories), North to South, East to West, Activity Machine (50+), Completionist

### 14. Trip Checkpoint System
- **What:** Activity-level progress tracking during active trips
- **Key Files:** `lib/useCheckpoints.ts`
- **How it works:**
  - User starts a trip → creates CheckpointState with all activities
  - Tapping an activity toggles completion
  - Progress persisted to localStorage
  - Day completion and trip completion events trigger celebrations
  - On trip complete → `passportService.completeTripAndAwardStamp()` awards stamp + XP + achievements

### 15. Leaderboard
- **What:** Global XP ranking with top 20 display
- **Key Files:** `lib/leaderboard.ts`
- **Firestore path:** `leaderboard/{uid}`
- **Fields:** uid, displayName, photoURL, totalXP, totalStamps, level, statesCount, lastUpdated

---

## 🔎 Search & Booking

### 16. Universal Booking Search
- **What:** Search flights, trains, cabs, hotels across multiple platforms
- **Key Files:**
  - `lib/api/travel-search.ts` — Search logic for all 4 types (SerpAPI google_flights / google_hotels, with graceful offline fallback)
  - `app/api/search/route.ts` — API proxy route
  - `app/bookings/page.tsx` — Booking UI (50KB)
  - `components/features/bookings/BookingPortal.tsx` — Booking portal component
- **Flights:**
  - SerpAPI Google Flights integration (when API key present)
  - Mock fallback with realistic data for 4 airlines
  - Google Flights deep links for all results
  - Pagination support
- **Hotels:**
  - SerpAPI Google Hotels integration (when API key present)
  - Booking.com deep links
  - Pagination support
- **Trains:**
  - 10-train corpus (Vande Bharat, Shatabdi, Rajdhani, Duronto, etc.)
  - Route-specific train selection
  - Cleartrip/IRCTC deep links
- **Cabs:**
  - Ola + Uber with fare estimation
  - Deep links with pre-filled pickup/drop coordinates

### 17. City Code Mapping
- **What:** 50+ Indian city IATA airport codes and railway station codes
- **Key File:** `lib/api/travel-search.ts` (CITY_MAP)
- **Cities covered:** Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad, Pune, Ahmedabad, Jaipur, Varanasi, Goa, Kochi, Udaipur, Agra, Rishikesh, Manali, Amritsar, Jodhpur, and 30+ more

### 18. Transport Deep Links Between Activities
- **What:** Ola/Uber/Auto fare estimates and deep links between consecutive itinerary activities
- **Key File:** `lib/transportLinks.ts`
- **Providers:** Auto (₹18/km, <15km only), Ola (₹14/km), Uber (₹13/km)
- **How:** Haversine distance → fare estimate → deep link with pre-filled coordinates

---

## 🎨 Frontend Components

### 19. Itinerary Flow (5-Step)
- **Components:**
  1. `SetupWizard.tsx` (31KB) — Multi-step form: destination, dates, purpose, group, budget, traveler type
  2. `VibeMatch.tsx` (22KB) — AI-powered vibe selection before generation
  3. `LoadingScreen.tsx` (14KB) — Animated loading with destination facts
  4. `ResultPage.tsx` (48KB) — Generated itinerary overview with highlights, restaurants, hotels
  5. `DayViewPage.tsx` (67KB) — Day-by-day view with activities, map, checkpoints, transport

### 20. Explore Page
- **Key Files:**
  - `app/explore/page.tsx` (30KB) — Destination grid with category filters
  - `components/features/explore/exploreData.ts` (29KB) — Static destination data for 30+ destinations
  - `app/explore/[destId]/page.tsx` — Deep dive per destination

### 21. Passport Page
- **Key File:** `app/passport/page.tsx` (40KB)
- **Sections:** Stats overview, stamp collection, achievement badges, XP progress bar, leaderboard

### 22. Shared UI Components
- **Navbar** — `components/shared/Navbar.tsx` (32KB) — Responsive with auth, search, theme toggle, mobile menu
- **Footer** — `components/shared/Footer.tsx` (5KB)
- **CalendarPicker** — Date selection component (6KB)
- **PlaceAutocomplete** — Google Places-powered autocomplete (9KB)
- **TravelersSelector** — Traveler count + type selector (5KB)
- **ItineraryMap** — Interactive Leaflet/Mapbox map (13KB)
- **SocialButton** — Floating social sharing button (6KB)
- **ThemeToggle** — Dark/light mode toggle (1KB)
- **VideoCard** — Video embed cards (4KB)
- **MorphSurface** — WebGL morph surface effect (14KB)
- **WebGLBackground** — Three.js background (1KB)

### 23. Home Page Sections
- **HeroSlider** — Auto-advancing destination hero (13KB)
- **HorizontalScroll** — GSAP ScrollTrigger horizontal section (5KB)
- **Stats Bar** — 50+ Destinations, 500+ OTA Partners, 10K+ Itineraries, 24/7 AI Guide
- **Feature Cards** — AI Itineraries, Digital Passport, Universal Booking Hub
- **Destination Grid** — Varanasi, Rajasthan, Himalayas, Kerala
- **Testimonials** — 3 user testimonials with ratings
- **Saved Section** — CTA for saved itineraries
- **Support Section** — Help center + contact

---

## 🔒 Security & Production

### 24. Security Headers
- **Key File:** `next.config.js`
- **Headers Applied (Production):**
  - Content-Security-Policy (comprehensive whitelist)
  - Strict-Transport-Security (2-year preload)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=(self)

### 25. Rate Limiting
- **Backend:** SlowAPI — 5/min for itinerary generate, 10/min for from-link
- **Frontend:** IP-based rate limiting (`lib/rateLimit.ts`)

### 26. Firestore Security Rules
- **Key File:** `firestore.rules`
- **Rules:**
  - `users/{userId}` — Read/write only by authenticated owner
  - `users/{userId}/{subcollection}/**` — Inherits parent rule
  - `itineraries/{shareId}` — Public read, auth required for create, owner required for update/delete

### 27. Error Tracking (Sentry)
- **Key Files:**
  - `instrumentation-client.ts` — Client-side error tracking (Sentry.init under Turbopack)
  - `sentry.server.config.ts` — Server-side error tracking
  - `sentry.edge.config.ts` — Edge runtime error tracking
  - `instrumentation.ts` — Loads server/edge SDKs; `onRequestError` captures route errors
- **Org:** naviigo, **Project:** naviigo-website

### 28. PWA Support
- **Key Files:**
  - `public/sw.js` — Service worker (4KB)
  - `app/manifest.ts` — Web app manifest
  - `app/offline/page.tsx` — Offline fallback page

### 29. SEO
- **Key Files:**
  - `app/layout.tsx` — Global metadata (OG, Twitter, Apple Web App)
  - `app/sitemap.ts` — Dynamic sitemap
  - `app/robots.ts` — Robots.txt
  - `app/itinerary/opengraph-image.tsx` — Dynamic OG image for itineraries

---

## 📂 Data & Services

### 30. Firebase Configuration
- **Key Files:**
  - `lib/firebase.ts` — Firebase app initialization
  - `lib/AuthContext.tsx` — Firebase Auth provider with Google sign-in
  - `lib/firestore.ts` — 736-line Firestore operations module
  - `lib/firestoreSchema.ts` — TypeScript interfaces for all collections

### 31. Firestore Collections
| Collection | Path | Purpose |
|-----------|------|---------|
| User Profile | `users/{uid}` | Display name, email, photo, trip/booking counts |
| Preferences | `users/{uid}/preferences/main` | Travel style, group, interests, dietary, searches |
| Bookings | `users/{uid}/bookings/{id}` | Flight/hotel/train/cab bookings with status |
| Itineraries | `users/{uid}/itineraries/{id}` | Saved generated itineraries |
| Tracking | `users/{uid}/tracking/{tripId}` | Live trip tracking sessions |
| Location History | `users/{uid}/tracking/{tripId}/locations/{id}` | GPS breadcrumbs |
| Passport Stats | `users/{uid}/passport/stats` | XP, level, streaks, achievements |
| Passport Stamps | `users/{uid}/passport/stamps/entries/{id}` | Individual trip stamps |
| Personalization Signals | `users/{uid}/personalization/signals` | Browsing behavior |
| Taste Vector | `users/{uid}/personalization/taste` | Gemini embedding vector |
| Bucket List | `users/{uid}/bucketList/{id}` | Saved destination wishlist |
| Trip Progress | `users/{uid}/trips/{tripId}` | Active trip checkpoint state |
| Shared Itineraries | `itineraries/{uuid}` | Public shareable itineraries |
| Reviews | `reviews/{destId}/entries/{id}` | Destination reviews + ratings |
| Leaderboard | `leaderboard/{uid}` | Global XP rankings |

### 32. Image System
- **Key Files:**
  - `lib/imageService.ts` — Universal image resolver (177 lines)
  - `lib/imageMap.ts` — Destination image mappings (9KB)
  - `public/destinations/` — Local destination images
- **Sources:** Local files (primary) → Unsplash CDN (legacy) → Google Places Photos → Gradient fallback

### 33. Festival Calendar
- **Key File:** `lib/festivalCalendar.ts` (12KB)
- **Purpose:** Indian festival data mapped to destinations for seasonal recommendations

### 34. Validation
- **Key File:** `lib/validation.ts` (4KB)
- **Purpose:** Input validation utilities for forms and API inputs

### 35. Live Weather (Open-Meteo)
- **Key Files:** `components/features/itinerary/WeatherStrip.tsx`, `app/api/weather/route.ts`
- **Purpose:** Free (no-key) live weather for itinerary views. Current + 7-day forecast; self-hides when offline/errors; 15-min client cache; anchors to map center or first activity with coords.
- **Status:** ✅ Shipped (task #19)

### 36. Voice Input on AI Chat (Phase 5a)
- **Key File:** `components/shared/MorphSurface.tsx`
- **Purpose:** Mic button in the AI chat dock using the Web Speech API (`SpeechRecognition`/`webkitSpeechRecognition`), `lang: 'en-IN'`. Feature-detected (mic hidden on unsupported browsers); transcripts fill the editable input; red pulse while listening; `aria-pressed` + labels.
- **Status:** ✅ Shipped (task #22)

### 37. Accessibility Pass (Phase 5b)
- **Files:** `Navbar.tsx`, `CalendarPicker.tsx`, `TravelersSelector.tsx`, `MorphSurface.tsx`, `Footer.tsx`, `PlaceAutocomplete.tsx`, `ItineraryMap.tsx`
- **Purpose:** Targeted screen-reader/keyboard pass: aria-labels on icon-only buttons (AI close/send/mic, calendar prev/next, travelers ±, search/newsletter inputs, chat input), keyboard-activatable AI dock (`role=button` + `tabIndex` + `onKeyDown`), `aria-expanded` on mobile menu chevrons, decorative `alt=""` for Leaflet popup images.
- **Status:** ✅ Shipped (task #23)

### 38. Per-Trip Expense Tracker (Phase 5c)
- **Key File:** `components/features/itinerary/ExpenseTracker.tsx`
- **Purpose:** Live spend log in the result page — ₹ INR formatting, 6 categories, editable budget vs actual, over-budget red bar, per-category breakdown, delete per entry. Persists to localStorage keyed by trip uuid via `useSyncExternalStore` (hydration-safe, multi-tab sync, offline/guest-safe).
- **Status:** ✅ MVP shipped (task #24); group split + CSV export specced in `Plans.md` §5.7

---

## 📱 Pages Inventory

| Page | Route | Size | Key Features |
|------|-------|------|-------------|
| Home | `/` | 15KB | Hero, GSAP scroll, stats, features, destinations, testimonials |
| Itinerary | `/itinerary` | 1.8KB | Wizard entry point |
| Itinerary UUID | `/itinerary/[uuid]` | — | Generated itinerary view |
| Itinerary History | `/itinerary/history` | — | Past itineraries |
| Itinerary Ongoing | `/itinerary/ongoing` | — | Active trip tracking |
| Itinerary Upcoming | `/itinerary/upcoming` | — | Upcoming trips |
| Explore | `/explore` | 30KB | Destination grid with categories |
| Explore Detail | `/explore/[destId]` | — | Deep dive per destination |
| Bookings | `/bookings` | 50KB | Multi-platform booking search |
| Passport | `/passport` | 40KB | Stamps, achievements, leaderboard |
| Saved | `/saved` | 8KB | Saved itineraries list |
| Deals | `/deals` | — | TravelPayouts affiliate widget |
| About | `/about` | — | About NaviiGo |
| Support | `/support` | — | FAQ + contact |
| Privacy | `/privacy` | — | Privacy policy |
| Terms | `/terms` | — | Terms of service |
| Offline | `/offline` | — | PWA offline fallback |
| Not Found | `/not-found` | 7KB | Custom 404 page |

---

## 🔧 Backend Service Inventory

| Service | File | Lines | Purpose |
|---------|------|-------|---------|
| Itinerary Model | `itinerary_model.py` | 590 | Deterministic personalization engine |
| Destination Cache | `destination_cache.py` | 376 | 4-layer caching system |
| Gemini Cache | `gemini_cache.py` | 378 | Redis/file response caching |
| Recommendations | `recommendations_engine.py` | 218 | Multi-signal destination scoring |
| User Data | `user_data.py` | 337 | Firebase user operations |
| Chat Engine | `chat_engine.py` | 86 | Gemini chat with actions |
| Deep Dive | `deep_dive_engine.py` | 102 | Destination deep-dive generation |
| From-Link | `from_link_engine.py` | 121 | Social URL → travel data extraction |
| Itinerary Engine | `itinerary_engine.py` | 109 | Gemini destination data fetch |
| Transport Engine | `transport_engine.py` | 118 | Transport options |
| Weather Engine | `weather_engine.py` | 98 | Open-Meteo weather data |
| Events Engine | `events_engine.py` | 100 | Google Events scraping |
| Embeddings | `embeddings_engine.py` | 55 | Gemini text embeddings |
| Pinecone | `pinecone_engine.py` | 65 | Vector similarity search |
| Firebase Client | `firebase_client.py` | 117 | Backend Firebase admin |
| Gemini Client | `gemini_client.py` | 26 | Gemini SDK initialization |

---

## 📦 Dependencies (Key Packages)

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^16.2.6 | React framework |
| react | ^19.2.4 | UI library |
| firebase | ^12.9.0 | Auth + Firestore |
| framer-motion | ^11.18.2 | Animations |
| gsap | ^3.14.2 | ScrollTrigger animations |
| @google/generative-ai | ^0.21.0 | Gemini AI client |
| @pinecone-database/pinecone | ^7.2.0 | Vector search |
| @sentry/nextjs | ^10.68.0 | Error tracking |
| @react-three/fiber + drei | ^9.5.0 / ^10.7.7 | WebGL effects |
| lucide-react | ^0.577.0 | Icons |
| jspdf + html2canvas | ^4.2.1 / ^1.4.1 | PDF export |
| next-themes | ^0.3.0 | Dark mode |
| lenis | ^1.3.23 | Smooth scrolling |

### Backend
| Package | Purpose |
|---------|---------|
| fastapi | Web framework |
| google-genai | Gemini AI SDK |
| firebase-admin | Firestore backend access |
| pinecone | Vector database |
| redis | Response caching |
| slowapi | Rate limiting |
| httpx | Async HTTP client |
| python-dotenv | Environment config |

---

> **Note:** This is a living document. Update it whenever new features are completed. This file should always reflect the current state of what's implemented and working.
