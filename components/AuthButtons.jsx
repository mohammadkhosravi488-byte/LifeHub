"use client";

import { useState, useEffect } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export default function AuthButtons() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Sign-in failed", error);
      alert("Google Sign-in failed. Check console for details.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-out failed", error);
    }
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:opacity-90"
      >
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt="avatar"
          className="w-8 h-8 rounded-full"
        />
      )}
      <span className="text-sm">{user.displayName || user.email}</span>
      <button
        onClick={handleSignOut}
        className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800"
      >
        Sign out
      </button>
    </div>
  );
}