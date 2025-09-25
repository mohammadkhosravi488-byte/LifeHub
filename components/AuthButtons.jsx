"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import DarkModeToggle from "@/components/DarkModeToggle"; // ✅ ADD THIS IMPORT

export default function AuthButtons() {
  const [user] = useAuthState(auth);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex items-center gap-3">
      {/* ✅ Dark mode button goes here */}
      <DarkModeToggle />

      {!user ? (
        <button
          onClick={login}
          className="px-4 py-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
        >
          Sign in
        </button>
      ) : (
        <button
          onClick={logout}
          className="px-4 py-1 rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm font-semibold"
        >
          Sign out
        </button>
      )}
    </div>
  );
}
