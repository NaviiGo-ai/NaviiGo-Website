import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// NaviiGo Firebase Configuration — naviigo-firebase project
const firebaseConfig = {
  apiKey: "AIzaSyBaVxZhhxIIsodXZLzWQMTKdhKGdEKfHg4",
  authDomain: "naviigo-firebase.firebaseapp.com",
  projectId: "naviigo-firebase",
  storageBucket: "naviigo-firebase.firebasestorage.app",
  messagingSenderId: "683587822562",
  appId: "1:683587822562:android:25fb7e31e8f84533444fbb"
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
