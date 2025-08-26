"use client";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your Firebase configuration (use yours here)
const firebaseConfig = {
  apiKey: "AIzaSyCzg6B-FRTMammyCoVNIz6YbfkRSn-PkLM",
  authDomain: "lifehub-7ba33.firebaseapp.com",
  projectId: "lifehub-7ba33",
  storageBucket: "lifehub-7ba33.firebasestorage.app",
  messagingSenderId: "140794283982",
  appId: "1:140794283982:web:5d90ad573a130574d44d9f",
  measurementId: "G-9WSZX309YQ"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Exports for AuthButtons.jsx
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
