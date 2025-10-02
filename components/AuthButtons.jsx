"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, googleProvider } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import ThemeToggle from "@/components/ThemeToggle";
import DarkModeToggle from "@/components/DarkModeToggle";
import { LifehubDataProvider } from "@/lib/data-context";

export default function AuthButtons() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => signInWithPopup(auth, googleProvider)}
        className="h-9 px-4 rounded-lg bg-indigo-600 text-white text-sm font-semibold"
      >
        Sign in with Google
      </button>
    );
  }
  <DarkModeToggle />
  const name = user.displayName || user.email || "User";
  const photo = user.photoURL || "";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-300 bg-white"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-700">
          Hello {name.split(" ")[0]}
        </span>
        {photo ? (
          <img
            src={photo}
            alt="avatar"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-lg border border-gray-200 bg-white shadow">
          <Link
            href="/settings"
            className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => {
              setOpen(false);
              signOut(auth);
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
