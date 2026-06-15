#!/usr/bin/env python3
"""
NaviiGo Firestore Database Seeder
==================================
Seeds the 'naviigo-db' Firestore database with the required collection
structure and initial data. Run this ONCE after creating the database.

Usage:
    cd backend
    python scripts/seed_firestore.py

This script will:
  1. Verify Firebase Admin SDK connection to 'naviigo-db'
  2. Create all required collections with proper document structure
  3. Seed sample/template data for development
  4. Print a summary of what was created

Collections created:
  - users/{uid}                              → User profiles
  - users/{uid}/preferences/main             → Travel preferences
  - users/{uid}/ai_profile/main              → AI taste vector + signals
  - users/{uid}/itineraries/{id}             → Saved itineraries
  - users/{uid}/bookings/{id}                → Bookings
  - users/{uid}/tracking/{tripId}            → Live tracking sessions
  - users/{uid}/passport/stats               → Passport stats
  - users/{uid}/passport/stamps/entries/{id} → Passport stamps
  - users/{uid}/bucketList/{id}              → Bucket list items
  - users/{uid}/trips/{tripId}               → Trip progress checkpoints
  - itineraries/{shareId}                    → Shared/collaborative itineraries
  - reviews/{destId}/entries/{id}            → Destination reviews
  - leaderboard/{uid}                        → Global XP leaderboard
  - _meta/schema_version                     → Schema metadata
"""

import os
import sys
from pathlib import Path
from datetime import datetime

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load environment
from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
load_dotenv(env_path)

import firebase_admin
from firebase_admin import credentials, firestore

# ── Connect to Firebase ──────────────────────────────────────────────────────

def init_firebase():
    """Initialize Firebase Admin SDK and connect to naviigo-db."""
    project_id = os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "naviigo-firebase")
    database_id = os.getenv("FIRESTORE_DATABASE_ID", "naviigo-db")

    # Find service account key
    backend_dir = Path(__file__).resolve().parent.parent
    sa_candidates = list(backend_dir.glob("*firebase*adminsdk*.json")) + \
                    list(backend_dir.glob("*service*account*.json"))

    sa_path = None
    for c in sa_candidates:
        if c.exists():
            sa_path = str(c)
            break

    if not sa_path:
        print("❌ No Firebase service account key found!")
        print(f"   Place it at: {backend_dir}/firebase-service-account.json")
        sys.exit(1)

    print(f"🔑 Using service account: {Path(sa_path).name}")

    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client(database_id=database_id)
    print(f"✅ Connected to Firestore (project: {project_id}, database: {database_id})")
    return db


# ── Seed Data ────────────────────────────────────────────────────────────────

def seed_schema_meta(db):
    """Create a _meta/schema_version document to track DB schema."""
    ref = db.collection("_meta").document("schema_version")
    ref.set({
        "version": "1.0.0",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "collections": [
            "users", "itineraries", "reviews", "leaderboard", "_meta"
        ],
        "description": "NaviiGo Firestore schema v1.0 — seeded by seed_firestore.py",
    })
    print("  ✓ _meta/schema_version")


def seed_sample_user(db):
    """Create a sample user document with all subcollections."""
    sample_uid = "naviigo-sample-user"
    user_ref = db.collection("users").document(sample_uid)

    # User profile
    user_ref.set({
        "uid": sample_uid,
        "displayName": "NaviiGo Sample User",
        "email": "sample@naviigo.com",
        "photoURL": None,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "lastLogin": firestore.SERVER_TIMESTAMP,
        "totalTrips": 2,
        "totalBookings": 1,
    })
    print("  ✓ users/{uid} (sample profile)")

    # Preferences
    user_ref.collection("preferences").document("main").set({
        "travelStyle": "mid-range",
        "preferredGroup": "couple",
        "interests": ["spiritual", "cultural", "food"],
        "dietaryPreferences": ["vegetarian"],
        "accessibilityNeeds": [],
        "homeCity": "Mumbai",
        "recentSearches": [],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/preferences/main")

    # AI Profile
    user_ref.collection("ai_profile").document("main").set({
        "tasteVector": [],
        "browsingSignals": {
            "clickedCategories": ["spiritual", "heritage"],
            "viewedDestinations": ["varanasi", "jaipur", "udaipur"],
            "timeOnCity": {"varanasi": 45, "jaipur": 30},
            "deepDiveVibes": [],
        },
        "pastDestinations": ["varanasi", "jaipur"],
        "lastRecommendations": [],
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/ai_profile/main")

    # Sample itinerary
    itin_ref = user_ref.collection("itineraries").document()
    itin_ref.set({
        "destId": "varanasi",
        "destName": "Varanasi",
        "form": {
            "destination": "varanasi",
            "startDate": "2026-07-01",
            "endDate": "2026-07-03",
            "purpose": "spiritual",
            "travelers": 2,
            "budget": "mid-range",
        },
        "generatedData": None,
        "isActive": False,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/itineraries/{id}")

    # Sample booking
    booking_ref = user_ref.collection("bookings").document()
    booking_ref.set({
        "type": "flight",
        "status": "confirmed",
        "bookingMethod": "redirect",
        "from": "Mumbai",
        "to": "Varanasi",
        "date": "2026-07-01",
        "travelers": 2,
        "providerName": "IndiGo",
        "providerCode": "6E-2045",
        "pnr": None,
        "totalPrice": 8500,
        "currency": "INR",
        "passengers": [
            {"title": "Mr", "firstName": "Sample", "lastName": "User", "age": "28", "gender": "male"}
        ],
        "contactEmail": "sample@naviigo.com",
        "contactPhone": "+91-9876543210",
        "redirectUrl": "https://www.goindigo.in",
        "redirectProvider": "IndiGo",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/bookings/{id}")

    # Passport stats
    user_ref.collection("passport").document("stats").set({
        "totalStamps": 2,
        "totalXP": 450,
        "level": 2,
        "streak": 1,
        "lastTripDate": firestore.SERVER_TIMESTAMP,
        "achievements": ["first_trip", "spiritual_seeker"],
        "statesVisited": ["Uttar Pradesh", "Rajasthan"],
        "citiesVisited": ["Varanasi", "Jaipur"],
        "categoryCounts": {"Spiritual": 1, "Heritage": 1},
        "totalActivitiesCompleted": 8,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/passport/stats")

    # Passport stamp entry
    stamp_ref = user_ref.collection("passport").document("stamps").collection("entries").document()
    stamp_ref.set({
        "name": "Varanasi — City of Light",
        "location": "varanasi",
        "state": "Uttar Pradesh",
        "icon": "🕉️",
        "type": "Spiritual",
        "xpEarned": 250,
        "visitedDate": firestore.SERVER_TIMESTAMP,
        "activities": ["Ganga Aarti", "Kashi Vishwanath", "Boat Ride"],
        "verificationMethod": "itinerary_complete",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/passport/stamps/entries/{id}")

    # Bucket list item
    user_ref.collection("bucketList").document("leh-ladakh").set({
        "id": "leh-ladakh",
        "name": "Leh Ladakh",
        "type": "Adventure",
        "image": None,
        "location": "Ladakh",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/bucketList/{id}")

    # Trip progress
    user_ref.collection("trips").document("sample-trip-1").set({
        "checkpointState": {"currentDay": 1, "completedActivities": []},
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ users/{uid}/trips/{tripId}")


def seed_shared_itinerary(db):
    """Create a sample shared itinerary."""
    ref = db.collection("itineraries").document("sample-share-goa")
    ref.set({
        "form": {
            "destination": "goa",
            "startDate": "2026-08-15",
            "endDate": "2026-08-18",
            "purpose": "leisure",
        },
        "customPlans": [],
        "destName": "Goa",
        "collaborators": 1,
        "ownerUid": "naviigo-sample-user",
        "invitedUsers": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ itineraries/{shareId} (shared)")


def seed_review(db):
    """Create a sample destination review."""
    ref = db.collection("reviews").document("varanasi").collection("entries").document()
    ref.set({
        "userId": "naviigo-sample-user",
        "userName": "NaviiGo Sample User",
        "userPhoto": "",
        "destId": "varanasi",
        "destName": "Varanasi",
        "rating": 5,
        "title": "Absolutely transformative experience!",
        "body": "The Ganga Aarti at Dashashwamedh Ghat was one of the most powerful experiences of my life.",
        "travelDate": "2026-03",
        "group": "couple",
        "budget": "mid-range",
        "pros": ["Spiritual atmosphere", "Amazing food", "Rich history"],
        "cons": ["Crowded in peak season"],
        "helpfulCount": 3,
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ reviews/{destId}/entries/{id}")


def seed_leaderboard(db):
    """Create a sample leaderboard entry."""
    ref = db.collection("leaderboard").document("naviigo-sample-user")
    ref.set({
        "uid": "naviigo-sample-user",
        "displayName": "NaviiGo Sample User",
        "photoURL": None,
        "totalXP": 450,
        "totalStamps": 2,
        "level": 2,
        "statesCount": 2,
        "lastUpdated": firestore.SERVER_TIMESTAMP,
    })
    print("  ✓ leaderboard/{uid}")


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("🌍 NaviiGo Firestore Database Seeder")
    print("=" * 60)
    print()

    db = init_firebase()
    print()

    print("📦 Seeding collections...")
    seed_schema_meta(db)
    seed_sample_user(db)
    seed_shared_itinerary(db)
    seed_review(db)
    seed_leaderboard(db)

    print()
    print("=" * 60)
    print("✅ Database seeded successfully!")
    print()
    print("Collections created in 'naviigo-db':")
    print("  • _meta/schema_version")
    print("  • users/{uid}")
    print("  • users/{uid}/preferences/main")
    print("  • users/{uid}/ai_profile/main")
    print("  • users/{uid}/itineraries/{id}")
    print("  • users/{uid}/bookings/{id}")
    print("  • users/{uid}/passport/stats")
    print("  • users/{uid}/passport/stamps/entries/{id}")
    print("  • users/{uid}/bucketList/{id}")
    print("  • users/{uid}/trips/{tripId}")
    print("  • itineraries/{shareId}")
    print("  • reviews/{destId}/entries/{id}")
    print("  • leaderboard/{uid}")
    print()
    print("Note: Sample data uses uid 'naviigo-sample-user'")
    print("   Real users will get their own docs on first sign-in.")
    print("=" * 60)


if __name__ == "__main__":
    main()
