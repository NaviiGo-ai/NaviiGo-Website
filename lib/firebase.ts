import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// NaviiGo Firebase Configuration — naviigo-firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAozizf5h_AqPmzV1ZQ0weRSWsYmSrIDnA",
  authDomain: "naviigo-firebase.firebaseapp.com",
  projectId: "naviigo-firebase",
  storageBucket: "naviigo-firebase.firebasestorage.app",
  messagingSenderId: "683587822562",
  appId: "1:683587822562:web:f5883b4f01f58b6e444fbb",
  measurementId: "G-FDFF0E6287"
};

// Initialize Firebase (singleton)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let analytics: ReturnType<typeof getAnalytics> | null = null;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth, db, storage };
