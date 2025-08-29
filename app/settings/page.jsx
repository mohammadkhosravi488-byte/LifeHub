"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      await setDoc(
        doc(db, "profiles", user.uid),
        {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      const snap = await getDoc(doc(db, "profiles", user.uid));
      setProfile(snap.exists() ? snap.data() : null);
    };
    load().catch((e) => setMsg(String(e?.message || e)));
  }, [user]);

  if (!user) return <main className="p-6">Please sign in.</main>;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      {msg && <div className="text-red-700 bg-red-50 border border-red-200 p-2 rounded">{msg}</div>}
      <div className="rounded border p-3">
        <div className="font-semibold">Your profile</div>
        <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </main>
  );
}
