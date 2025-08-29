"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function AuthButtons() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Keep UI in sync with auth; also handle redirect-based login and write profile
  useEffect(() => {
    // If a previous attempt fell back to redirect, resolve it silently
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      // Create/update basic user profile for sharing features
      if (u) {
        try {
          await setDoc(
            doc(db, "profiles", u.uid),
            {
              uid: u.uid,
              email: u.email || "",
              displayName: u.displayName || "",
              photoURL: u.photoURL || "",
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error("Failed to upsert profile:", e);
        }
      }
    });

    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      // Popup may be blocked — fall back to redirect
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err) {
        console.error("Sign-in failed:", err);
        alert("Google Sign-in failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign-out failed:", e);
      alert("Sign-out failed. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium shadow hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in with Google"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt="avatar"
          className="w-8 h-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className="text-sm font-medium text-gray-800">
        {user.displayName || user.email}
      </span>
      <button
        onClick={handleSignOut}
        disabled={loading}
        className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-60"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
