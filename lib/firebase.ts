import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, memoryLocalCache } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// NaviiGo Firebase Configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app (singleton — safe on both server and client)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase services use browser-only APIs; calling them during SSR returns null
// and crashes client code. Only initialize in the browser.
const isBrowser = typeof window !== 'undefined';
const auth: Auth | null = isBrowser ? getAuth(app) : null;



// Firestore: use named database 'naviigo-db'.
function getDb(): Firestore | null {
  if (!isBrowser) return null;
  // Initialize explicitly for the named database to ensure correct routing
  // Otherwise, some operations might fall back to '(default)'
  try {
    return initializeFirestore(app, { localCache: memoryLocalCache() }, 'naviigo-db');
  } catch (e) {
    // If it's already initialized, fallback to getFirestore
    return getFirestore(app, 'naviigo-db');
  }
}
const db: Firestore = (getDb() ?? null!) as Firestore;
const storage: FirebaseStorage | null = isBrowser ? getStorage(app) : null;

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db, storage };
