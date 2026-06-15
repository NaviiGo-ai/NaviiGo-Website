# ─── Firebase Admin SDK Client ──────────────────────────────────────────────────
# Initializes Firebase Admin with either a service account key file or
# application default credentials. Provides a Firestore client for the
# Python backend to read/write the SAME collections as the Next.js frontend.
#
# Firestore collections used:
#   users/{uid}                         — User profile
#   users/{uid}/preferences/main        — User preferences (travel style, interests)
#   users/{uid}/itineraries/{id}        — Saved itineraries
#   users/{uid}/ai_profile/main         — AI-specific data (taste vector, browsing signals)
#   users/{uid}/bookings/{id}           — Bookings
#   users/{uid}/passport/stats          — Digital passport stats

import os
import json
from pathlib import Path
from typing import Optional

# pyrefly: ignore [missing-import]
import firebase_admin
from firebase_admin import credentials, firestore

_app: Optional[firebase_admin.App] = None
_db = None


def _init():
    """Initialize Firebase Admin SDK (singleton)."""
    global _app, _db

    if _app is not None:
        return

    project_id = os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "naviigo-firebase")

    # Priority 1: Service account key from JSON string (Best for Production/Render/Railway)
    sa_json_str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if sa_json_str:
        try:
            import json
            cred_dict = json.loads(sa_json_str)
            cred = credentials.Certificate(cred_dict)
            _app = firebase_admin.initialize_app(cred)
            print(f"[Firebase] Initialized with service account from FIREBASE_SERVICE_ACCOUNT_JSON environment variable.")
            return
        except Exception as e:
            print(f"[Firebase] Error parsing FIREBASE_SERVICE_ACCOUNT_JSON: {e}")

    # Priority 2: Service account key file
    sa_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
    if not sa_path:
        backend_dir = Path(__file__).resolve().parent.parent
        project_dir = backend_dir.parent
        candidates = [
            backend_dir / "firebase-service-account.json",
            backend_dir / "serviceAccountKey.json",
            project_dir / "firebase-service-account.json",
        ]
        # Also search for any firebase admin SDK key file (auto-downloaded names)
        for pattern in ["*firebase*adminsdk*.json", "*service*account*.json"]:
            candidates.extend(backend_dir.glob(pattern))
        
        for c in candidates:
            if c.exists():
                sa_path = str(c)
                break

    if sa_path and Path(sa_path).exists():
        print(f"[Firebase] Initializing with service account: {Path(sa_path).name}")
        cred = credentials.Certificate(sa_path)
        _app = firebase_admin.initialize_app(cred)
    else:
        # Priority 3: Application Default Credentials (works natively on GCP/Cloud Run)
        try:
            _app = firebase_admin.initialize_app(options={"projectId": project_id})
            print(f"[Firebase] Initialized with application default credentials (project: {project_id})")
        except Exception as e:
            print(f"[Firebase] WARNING: Could not initialize Firebase Admin SDK: {e}")
            print(f"[Firebase] User data persistence is DISABLED. Place a service account JSON at backend/firebase-service-account.json")
            return

    database_id = os.getenv("FIRESTORE_DATABASE_ID", "naviigo-db")
    _db = firestore.client(database_id=database_id)
    print(f"[Firebase] Firestore client ready (project: {project_id}, database: {database_id})")


def get_db():
    """Get the Firestore client. Returns None if Firebase is not configured."""
    _init()
    return _db


def is_firebase_configured() -> bool:
    """Check if Firebase is properly initialized."""
    _init()
    return _db is not None
