import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKl8nEpq5yBGtxZ99xTnwqM2fv4zTg_Ss",
  authDomain: "naviigo-tourism.firebaseapp.com",
  projectId: "naviigo-tourism",
  storageBucket: "naviigo-tourism.firebasestorage.app",
  messagingSenderId: "754148618223",
  appId: "1:754148618223:web:5a8a64b79825a54854d01a",
  measurementId: "G-39JJ87DFXS"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let analytics;

if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics, auth };
