# NaviiGo Production Environment Variables

## Required Environment Variables

### Core Application
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `APP_ENV` | Application environment (`development`, `test`, `production`) | `production` | Yes |
| `DEBUG` | Enable debug mode (`true`/`false`) | `false` | No (defaults to `false`) |
| `APP_NAME` | Application name | `NaviiGo` | No (defaults to "NaviiGo AI Engines") |

### Database (PostgreSQL in Production)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql+asyncpg://user:password@host:5432/naviigo` | Yes |

### Firebase Authentication
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FIREBASE_PROJECT_ID` | Firebase project ID | `naviigo-firebase` | Yes |

### Redis (for caching, rate limiting, locks)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REDIS_URL` | Redis connection URL | `redis://:password@host:6379/0` | No (defaults to empty - disables Redis) |

### Gemini AI
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Gemini API key | `AIza...` | Yes |
| `GEMINI_MODEL` | Gemini model to use | `gemini-2.5-flash` | No (defaults to `gemini-2.5-flash`) |

### Razorpay Payments (India)
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RAZORPAY_KEY_ID` | Razorpay key ID | `rzp_test_...` | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | `...` | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret for signature verification | `whsec_...` | Yes |

### PostHog Analytics
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `POSTHOG_API_KEY` | PostHog API key | `phc_...` | No |
| `POSTHOG_HOST` | PostHog host URL | `https://us.i.posthog.com` | No (defaults to `https://us.i.posthog.com`) |

### Supplier APIs
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `TRAVELPAYOUTS_TOKEN` | TravelPayouts affiliate token (flights/hotels white-label & deep links) | `...` | No |

> **Bookings model:** NaviiGo completes bookings by **redirecting** to operators/OTAs
> (IRCTC, Booking.com, MakeMyTrip, Goibibo, Ola/Uber, TravelPayouts). No GDS creds
> are used — Amadeus was removed (weak domestic-India coverage, needs a sales-agent
> setup, and its booking routes accepted raw card data). The frontend flight search
> runs on the TravelPayouts white-label widget + SerpAPI (`google_flights`/`google_hotels`)
> with graceful fallback; every result deep-links out to the operator for checkout.

### CORS Configuration
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | `https://naviigo.in,https://www.naviigo.in` | No (defaults to localhost dev URLs) |

### SSRF Protection
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `URL_FETCH_MAX_BYTES` | Maximum response size for URL fetches (bytes) | `524288` | No (defaults to 512KB) |
| `URL_FETCH_TIMEOUT_SECONDS` | Timeout for URL fetch requests (seconds) | `6.0` | No (defaults to 6.0) |
| `URL_FETCH_MAX_REDIRECTS` | Maximum redirects to follow | `3` | No (defaults to 3) |

### Product Configuration
| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DEFAULT_CURRENCY` | Default currency for pricing | `INR` | No (defaults to `INR`) |
| `OFFER_TTL_SECONDS` | Supplier offer TTL in seconds | `900` | No (defaults to 900 - 15 minutes) |
| `TRIP_MAX_DAYS` | Maximum trip duration in days | `14` | No (defaults to 14) |
| `TRUST_PROXY` | Trust X-Forwarded-For header for client IP (set to true behind trusted proxy like AWS ALB/Nginx) | `true` | No (defaults to `false`) |

## Environment File Examples

### `.env.production`
```env
APP_ENV=production
DEBUG=false
APP_NAME=NaviiGo

DATABASE_URL=postgresql+asyncpg://naviigo_user:secure_password@db.navii-go.internal:5432/naviigo

FIREBASE_PROJECT_ID=naviigo-firebase-production

REDIS_URL=redis://:redis_password@redis.navii-go.internal:6379/0

GEMINI_API_KEY=AIzaSyYourActualGeminiKeyHere
GEMINI_MODEL=gemini-2.5-flash

RAZORPAY_KEY_ID=rzp_live_your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here

POSTHOG_API_KEY=phc_your_posthog_key
POSTHOG_HOST=https://us.i.posthog.com

TRAVELPAYOUTS_TOKEN=your_travelpayouts_token

CORS_ORIGINS=https://naviigo.in,https://www.naviigo.in

URL_FETCH_MAX_BYTES=524288
URL_FETCH_TIMEOUT_SECONDS=6.0
URL_FETCH_MAX_REDIRECTS=3

DEFAULT_CURRENCY=INR
OFFER_TTL_SECONDS=900
TRIP_MAX_DAYS=14
```

### `.env.development`
```env
APP_ENV=development
DEBUG=true
APP_NAME=NaviiGo (Development)

DATABASE_URL=sqlite+aiosqlite:///./naviigo_dev.db

FIREBASE_PROJECT_ID=naviigo-firebase-dev

# Redis optional in dev
REDIS_URL=

# Use test keys in development
GEMINI_API_KEY=AIzaSyTestKey123
GEMINI_MODEL=gemini-2.5-flash

RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=whsec_your_test_webhook_secret

# Disable analytics in dev or use test keys
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.i.posthog.com

# TravelPayouts affiliate token (optional in dev — the white-label widget runs keyless)
TRAVELPAYOUTS_TOKEN=your_travelpayouts_test_token

CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

URL_FETCH_MAX_BYTES=524288
URL_FETCH_TIMEOUT_SECONDS=6.0
URL_FETCH_MAX_REDIRECTS=3

DEFAULT_CURRENCY=INR
OFFER_TTL_SECONDS=900
TRIP_MAX_DAYS=14
```

## Validation

The application validates critical environment variables on startup. Missing required variables will cause the application to fail fast with clear error messages indicating which variables need to be set.

## Secrets Management

In production environments, it is strongly recommended to use a secrets management service (AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager, etc.) rather than plain `.env` files. The application reads from standard environment variables, making it compatible with any secrets injection mechanism.

## Changing Environment

To change environments, simply set the `APP_ENV` variable:
- `APP_ENV=development` for local development
- `APP_ENV=test` for CI/CD test runs
- `APP_ENV=production` for production deployments

Remember to rebuild/restart the application after changing environment variables.