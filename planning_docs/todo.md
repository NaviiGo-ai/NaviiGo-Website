# 🧭 NaviiGo — TODO List

> **Purpose:** Active task tracker for pending work. Tasks move here from `Plans.md` when a feature is being implemented. Mark as complete when done, then update `implemented.md`.
>
> **Last Updated:** 2026-08-11

---

## 📌 How to Use This File
- Tasks come from approved plans in `Plans.md`
- Use these statuses: `[ ]` pending, `[/]` in progress, `[x]` done
- When a feature's tasks are all `[x]`, move the summary to `implemented.md`
- Add subtasks when working on a feature for granular tracking
- Always include the file paths affected

---

## 🔴 Critical / Blocking Tasks

> Nothing critical at the moment. All Phase 1-4 tasks are complete.

---

## 🟡 High Priority — Upcoming Work

### Performance & Optimization
- [ ] Run Lighthouse audit and document scores
- [ ] Optimize bundle size — analyze with `@next/bundle-analyzer`
- [ ] Lazy load heavy components (DayViewPage is 67KB, ResultPage is 48KB)
- [ ] Add image optimization for local destination images
- [ ] Review and optimize Firestore read/write patterns (avoid N+1 queries)

### Code Quality
- [ ] Add TypeScript strict mode and fix any type issues
- [ ] Replace `any` types in AIContext with proper interfaces
- [ ] Add proper error boundaries for each major page
- [ ] Write unit tests for the deterministic itinerary model (frontend version)
- [ ] Add integration tests for API proxy routes

### Backend Improvements
- [ ] Add request validation middleware for all routers
- [ ] Add structured logging (replace `print()` with proper logger)
- [ ] Add health check endpoint for monitoring
- [ ] Implement graceful shutdown handling
- [ ] Add OpenAPI schema documentation for all endpoints

### Data Quality
- [ ] Populate CSV destination data for 50+ Indian cities
- [ ] Add quality images for all destinations in `/public/destinations/`
- [ ] Verify and update IATA/station codes in travel-search.ts city map
- [ ] Add seasonal pricing data to destination cache

---

## 🟢 Medium Priority — Enhancements

### Itinerary Improvements
- [ ] Add drag-and-drop reordering for day activities in DayViewPage
- [ ] Add "Add custom activity" button for manual additions
- [ ] Support editing activity duration and time in the UI
- [ ] Add "Regenerate this day" button per day
- [ ] Add PDF export with better formatting (current jspdf is basic)
- [ ] Add text/WhatsApp sharing for itineraries

### Booking System
- [ ] Add real SerpAPI integration for flights (currently using API key check)
- [ ] Add hotel booking confirmation flow
- [ ] Implement booking history page with status tracking
- [ ] Add price alerts for saved destinations
- [ ] Add train PNR status checking integration

### Passport & Gamification
- [ ] Add stamp celebration animation improvements
- [ ] Add "Share Achievement" social buttons
- [ ] Add monthly/weekly leaderboard views
- [ ] Add friend system (follow other travelers)
- [ ] Add seasonal challenges (e.g., "Visit 3 hill stations in summer")

### Explore Page
- [ ] Add search/filter functionality to destination grid
- [ ] Add "Compare Destinations" feature
- [ ] Add user-submitted destination reviews directly on explore page
- [ ] Add weather overlay on destination cards (real-time)
- [ ] Improve destination data quality with verified local info

### User Experience
- [ ] Add onboarding tour for first-time users
- [ ] Add preference wizard on first sign-in
- [ ] Improve mobile responsiveness (especially DayViewPage)
- [ ] Add skeleton loading states for all async content
- [ ] Add toast notifications for key actions (save, delete, share)

---

## 🔵 Low Priority — Nice to Have

### Design Polish
- [ ] Add page transition animations between routes
- [ ] Improve dark mode color consistency across all pages
- [ ] Add micro-interactions to buttons and cards
- [ ] Create custom loading animations per page type
- [ ] Add parallax effects to destination hero images

### Developer Experience
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Add pre-commit hooks (lint + type check)
- [ ] Create deployment scripts for frontend (Vercel) + backend (Render/Railway)
- [ ] Add environment variable validation on startup
- [ ] Create seed script for demo data

### Documentation
- [ ] Add API documentation with example requests/responses
- [ ] Create component storybook or documentation
- [ ] Document Firestore schema with example data
- [ ] Create contribution guide with code style rules
- [ ] Add architecture decision records (ADRs)

### Analytics
- [ ] Add Google Analytics / Mixpanel event tracking
- [ ] Track itinerary generation success/failure rates
- [ ] Track booking search → redirect conversion rates
- [ ] Monitor cache hit rates via admin dashboard
- [ ] Add user session recording (Hotjar/FullStory)

---

## 📋 Feature-Specific Task Lists

### When Starting: Multi-City Itineraries (Plan 5.1)
- [ ] Design data model for multi-city itineraries
- [ ] Update `ItineraryRequest` schema to support array of destinations
- [ ] Build inter-city transport recommendation engine
- [ ] Update `generate_itinerary` to handle city transitions
- [ ] Create circuit templates (Golden Triangle, etc.)
- [ ] Update DayViewPage to show city transitions
- [ ] Update ResultPage to show multi-city overview
- [ ] Test with 3-4 popular circuits

### When Starting: Group Collaboration (Plan 5.2)
- [ ] Design Firestore schema for collaborative itineraries
- [ ] Implement real-time listener for itinerary updates
- [ ] Build activity voting UI
- [ ] Add group member management (invite/remove)
- [ ] Implement conflict resolution for simultaneous edits
- [ ] Add group chat within itinerary
- [ ] Test with 3+ concurrent editors

### When Starting: Expense Tracker (Plan 5.7)
- [ ] Design expense data model (categories, splits, currency)
- [ ] Build expense input form with category picker
- [ ] Implement group split calculator
- [ ] Add budget vs actual dashboard
- [ ] Add CSV/PDF export for expenses
- [ ] Integrate with trip checkpoint flow

---

## 🐛 Known Bugs / Technical Debt

- [x] **✅ Itinerary now saves to Firestore:** Moved `saveItineraryByUUID` from server-side API route to client-side `LoadingScreen.tsx` so the user's Firebase auth session is available. Updated `firestore.rules` to allow guest (unauthenticated) creates on `itineraries/{uuid}`. Also forwarded all travel logistics fields (`mustDo`, `arrivalTime`, etc.) through `route.ts` → Python backend.
- [ ] `any` types in firestore.ts — some functions use `any` for Firestore data
- [ ] AIContext has `itinerary: any` — needs proper typing
- [ ] `setActiveItinerary` iterates all itineraries — needs batch update
- [ ] Hotel search deep links don't include check-out date
- [ ] Cab results are static mock data — need real-time Ola/Uber API
- [ ] Review section helpfulCount has no user-level deduplication
- [ ] Firestore security rules don't cover `reviews/{destId}/entries` write permissions
- [ ] `resolveImgSrc` has complex fallback logic — needs simplification
- [ ] `getLeaderboard` fetches all docs for rank calculation — needs pagination

---

## ✅ Recently Completed (Move to implemented.md)

- [x] **Backend Bug Fix:** Fixed payload field access error in `backend/routers/itinerary.py` (`arrivalTime`, `arrivalMode`, `departureTime`, `departureMode`, `hotelArea`, `originCity`, `mustDo`).
- [x] **Backend Bug Fix:** Fixed Firebase Client initialization early return bug in `backend/services/firebase_client.py`.
- [x] **Travel Logistics Integration:** Extended `ItineraryRequest` and `SetupWizard` with logistics parameters (arrival/departure time & mode, hotel area, origin city, pinned activities).
- [x] **Image Proxy & Media Service:** Built `/api/places/photo/route.ts` API route and `PlaceImage` component to replace Unsplash with Wikimedia Commons and Google Places photo proxying.
- [x] **Firestore Named DB Support:** Updated `lib/firebase.ts` to support named database instances and enhanced Firestore security rules (`firestore.rules`).
- [x] **Itinerary saves to Firestore (Bug Fix):** Moved Firestore write from server-side API route to client-side `LoadingScreen.tsx`. Updated `firestore.rules` to allow guest creates. Forwarded all travel logistics fields through `route.ts`.
- [x] **Saved Trips Navigation Fix:** Updated `DayViewPage.tsx` and `ResultPage.tsx` to store `_uuid` when saving itineraries, and updated `app/saved/page.tsx` to navigate directly to `/itinerary/{uuid}` so saved trips open seamlessly without triggering "Itinerary Not Found".

---

> **Note:** This is a living document. Update it every time you start or complete a task. Keep it in sync with `Plans.md` and `implemented.md`.
