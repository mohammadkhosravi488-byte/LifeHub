"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-3">Settings</h1>
        <p className="text-gray-700">Please sign in first.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="text-sm text-gray-800">
          <div><span className="text-gray-500">Name: </span>{user.displayName || "-"}</div>
          <div><span className="text-gray-500">Email: </span>{user.email || "-"}</div>
        </div>
        <button
          className="h-9 px-4 rounded-lg border border-gray-300 bg-white text-sm"
          onClick={() => signOut(auth)}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
