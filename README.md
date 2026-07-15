# 🧭 NaviiGo — AI-Powered Travel Platform

> India's smartest travel companion. AI itineraries, booking aggregation, destination deep-dives, and a gamified digital passport — all in one platform.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?logo=firebase)
![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?logo=google)

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Running Locally](#running-locally)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Features](#features)
- [Deployment](#deployment)

---

## Architecture

```
┌──────────────────────────────────┐
│         Next.js Frontend         │
│  (React 19 + TypeScript + TW)   │
│                                  │
│  app/api/* ── proxy routes ──────┼──────┐
│  components/ ── UI layer         │      │
│  lib/ ── auth, firestore, utils  │      │
└──────────────────────────────────┘      │
                                          ▼
┌──────────────────────────────────┐
│     Python FastAPI Backend       │
│                                  │
│  routers/ ── API endpoints       │
│  services/ ── AI engines         │
│    ├── itinerary_engine.py       │
│    ├── chat_engine.py            │
│    ├── recommendation_engine.py  │
│    ├── deep_dive_engine.py       │
│    └── taste_engine.py           │
│                                  │
│  Gemini AI ── LLM generation     │
│  Pinecone  ── vector search      │
│  Redis     ── response caching   │
└──────────────────────────────────┘
```

**Data flow**: Frontend → Next.js API route (proxy) → Python backend → AI/DB → Response.

---

## Prerequisites

| Tool | Version | Required |
|---|---|---|
| **Node.js** | 18+ (LTS recommended) | ✅ Yes |
| **Python** | 3.10+ | ✅ Yes |
| **npm** | 9+ | ✅ Yes |
| **Firebase project** | — | ✅ Yes (Auth + Firestore) |
| **Google Gemini API key** | — | ✅ Yes |
| **Redis** | 7+ | ⚠️ Optional (file cache fallback) |
| **Pinecone account** | — | ⚠️ Optional (for vector search) |

---

## Environment Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/naviigo-web.git
cd naviigo-web/NaviiGo-Website
```

### 2. Frontend dependencies

```bash
npm install
```

### 3. Backend dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 4. Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.local.example .env.local
```

Required variables in `.env.local`:

```env
# ── AI (required) ─────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ── Firebase (required) ───────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# ── Python backend URL ────────────────────
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000

# ── Google APIs (optional) ────────────────
GOOGLE_PLACES_API_KEY=your_places_key
GOOGLE_DISTANCE_MATRIX_KEY=your_distance_matrix_key

# ── Pinecone (optional) ──────────────────
PINECONE_API_KEY=your_pinecone_key

# ── Redis (optional) ─────────────────────
REDIS_URL=redis://localhost:6379

# ── Sentry (optional) ───────────────────
SENTRY_DSN=your_sentry_dsn

# ── CORS for backend (production) ────────
CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### 5. Firebase service account (backend)

For Firestore access from the Python backend, place your Firebase service account JSON at:

```
backend/firebase-service-account.json
```

> Download from: Firebase Console → Project Settings → Service Accounts → Generate new private key

---

## Running Locally

You need **two terminals** — one for the frontend, one for the backend.

### Terminal 1: Next.js Frontend

```bash
npm run dev
# → http://localhost:3000
```

### Terminal 2: Python Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

The frontend proxies AI requests to the backend via `/app/api/*` routes.

---

## Running Tests

### Backend tests (pytest)

```bash
cd backend
python -m pytest test_all.py -v
```

Tests use FastAPI's `TestClient` — no running server needed.

### Frontend linting

```bash
npm run lint
```

### Production build check

```bash
npm run build
```

---

## Project Structure

```
NaviiGo-Website/
├── app/                    # Next.js App Router pages
│   ├── api/                # API proxy routes (→ Python backend)
│   │   ├── chat/           # AI chat proxy
│   │   ├── itinerary/      # Itinerary generate + from-link
│   │   ├── explore/        # Deep dive + events proxy
│   │   ├── recommendations/# AI recommendations proxy
│   │   ├── search/         # Booking search (flights/trains/cabs/hotels)
│   │   └── taste/          # Taste vector update
│   ├── about/              # About page
│   ├── bookings/           # Booking aggregation UI
│   ├── deals/              # TravelPayouts widget
│   ├── explore/            # Destination grid + [destId] deep dive
│   ├── itinerary/          # Trip planner wizard + result
│   ├── passport/           # Digital passport + leaderboard
│   ├── saved/              # Saved itineraries
│   ├── support/            # FAQ + contact
│   ├── layout.tsx          # Root layout (providers, fonts, metadata)
│   └── page.tsx            # Landing page
├── backend/                # Python FastAPI backend
│   ├── routers/            # API endpoint definitions
│   ├── services/           # AI engine implementations
│   ├── cache/              # File-based cache fallback
│   ├── data/               # CSV destination data
│   ├── main.py             # FastAPI app entry point
│   ├── test_all.py         # Pytest test suite
│   └── requirements.txt    # Python dependencies (pinned)
├── components/
│   ├── features/           # Feature-specific components
│   │   ├── explore/        # Explore page components + data
│   │   ├── itinerary/      # Setup wizard, result, sharing
│   │   ├── reviews/        # Review section
│   │   └── tracking/       # Trip tracking UI
│   ├── shared/             # Navbar, Footer, ThemeToggle
│   └── ui/                 # Base UI primitives
├── context/                # React context providers (AIContext)
├── lib/                    # Utilities & services
│   ├── api/                # API client helpers
│   ├── ai/                 # Gemini client + embeddings
│   ├── AuthContext.tsx      # Firebase auth provider
│   ├── firebase.ts          # Firebase init
│   ├── firestore.ts         # Firestore CRUD operations
│   ├── rateLimit.ts         # IP-based rate limiting
│   └── browsingSignals.ts   # User behavior tracking
├── public/
│   ├── sw.js               # Service worker (PWA)
│   └── manifest.json       # PWA manifest
├── .env.local.example      # Environment variable template
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── firestore.rules         # Firestore security rules
└── package.json            # Node.js dependencies
```

---

## Features

| Feature | Status | Tech |
|---|---|---|
| AI Itinerary Generator | ✅ | Gemini + CSV data + deterministic fallback |
| Social Link → Itinerary | ✅ | Gemini link/caption parsing |
| AI Chat Assistant | ✅ | Gemini with itinerary context |
| Destination Deep Dive | ✅ | Gemini + Reddit consensus |
| Booking Aggregation | ✅ | Flights, trains, cabs, hotels |
| Digital Passport | ✅ | Firebase + gamification (XP, stamps) |
| Taste Profiling | ✅ | Vector embeddings + Pinecone |
| AI Recommendations | ✅ | Taste vector + seasonal scoring |
| Live Events | ✅ | Google Events scraping + caching |
| Weather Integration | ✅ | Open-Meteo (free, no key) |
| PWA / Offline | ✅ | Service worker + offline page |
| Auth | ✅ | Firebase Google Auth |
| Dark Mode | ✅ | next-themes + system preference |
| Error Tracking | ✅ | Sentry (client + server + edge) |
| Security | ✅ | CSP, HSTS, rate limiting, Firestore rules |

---

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set all environment variables from `.env.local` in the Vercel dashboard
3. Deploy — Vercel auto-detects Next.js

### Backend (Railway / Render / Cloud Run)

1. Deploy the `backend/` directory as a Python service
2. Set `GEMINI_API_KEY`, `CORS_ORIGINS`, and other env vars
3. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set `CORS_ORIGINS` to your Vercel domain (e.g., `https://naviigo.vercel.app`)

### Firebase

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Ensure Auth providers (Google) are enabled in Firebase Console

---

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and naming conventions
3. Run `npm run lint` and `python -m pytest backend/test_all.py -v` before submitting
4. Open a PR with a clear description of changes

---

## License

Proprietary — NaviiGo © 2026. All rights reserved.
