"use client";

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzg6B-FRTMammyCoVNIz6YbfkRSn-PkLM",
  authDomain: "lifehub-7ba33.firebaseapp.com",
  projectId: "lifehub-7ba33",
  storageBucket: "lifehub-7ba33.firebasestorage.app",
  messagingSenderId: "140794283982",
  appId: "1:140794283982:web:5d90ad573a130574d44d9f",
  measurementId: "G-9WSZX309YQ",
};

const app = initializeApp(firebaseConfig);

// ✅ Exports
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
