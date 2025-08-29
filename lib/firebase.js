// lib/firebase.js
// SAFE for Next.js (no analytics on server)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⛳ Use YOUR config (you pasted earlier). Keep it exactly the same here.
const firebaseConfig = {
  apiKey: "AIzaSyCzg6B-FRTMammyCoVNIz6YbfkRSn-PkLM",
  authDomain: "lifehub-7ba33.firebaseapp.com",
  projectId: "lifehub-7ba33",
  storageBucket: "lifehub-7ba33.firebasestorage.app",
  messagingSenderId: "140794283982",
  appId: "1:140794283982:web:5d90ad573a130574d44d9f",
  measurementId: "G-9WSZX309YQ",
};

// Ensure we only init once
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth + provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firestore
export const db = getFirestore(app);

// (Optional) Analytics ONLY in browser if you ever need it:
// if (typeof window !== "undefined") {
//   import("firebase/analytics").then(({ getAnalytics }) => getAnalytics(app));
// }
