"use client";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Settings</h2>
      {!user && <p>Please sign in to manage settings.</p>}
      {user && (
        <div className="space-y-4">
          <div className="p-4 border rounded-xl bg-white">Account: {user.email}</div>
          <div className="p-4 border rounded-xl bg-white">Calendars & Sharing (coming next)</div>
          <div className="p-4 border rounded-xl bg-white">AI Preferences (coming next)</div>
        </div>
      )}
    </main>
  );
}
