"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

function initialFrom(nameOrEmail) {
  if (!nameOrEmail) return "?";
  const c = nameOrEmail.trim()[0];
  return (c || "?").toUpperCase();
}

export default function AuthButtons() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Sign-in failed:", e);
      alert("Sign-in failed. Please try again.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Sign-out failed:", e);
      alert("Sign-out failed. Please try again.");
    }
  };

  if (loading) {
    return <div className="h-9 w-28 rounded-md bg-gray-200 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        className="px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
      >
        Sign in
      </button>
    );
  }

  const firstName = user?.displayName?.split(" ")[0] ?? "You";
  const avatarUrl = user?.photoURL ?? null;
  const fallbackLetter = initialFrom(user?.displayName || user?.email);

  return (
    <div className="flex items-center gap-3">
      <Link href="/settings" className="inline-flex items-center gap-2 group">
        <span className="text-sm font-semibold text-gray-800 group-hover:underline">
          {`Hello ${firstName}`}
        </span>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt="Profile"
            className="h-9 w-9 rounded-full border border-gray-200 object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full border border-gray-200 bg-gray-100 grid place-items-center text-sm text-gray-600">
            {fallbackLetter}
          </div>
        )}
      </Link>

      <button
        onClick={handleSignOut}
        className="text-sm text-gray-600 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
