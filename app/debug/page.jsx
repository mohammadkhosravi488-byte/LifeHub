"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { googleProvider } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function DebugPage() {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle");
  const [lastRead, setLastRead] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const doSignIn = async () => {
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const doSignOut = async () => {
    setError("");
    try {
      await signOut(auth);
    } catch (e) {
      setError(String(e?.message || e));
    }
  };

  const writeAndRead = async () => {
    if (!user) return;
    setStatus("writing…");
    setError("");
    try {
      const ref = doc(db, "users", user.uid, "debug", "ping");
      await setDoc(ref, { hello: "world", ts: serverTimestamp() }, { merge: true });
      setStatus("reading…");
      const snap = await getDoc(ref);
      setLastRead(snap.exists() ? snap.data() : null);
      setStatus("ok");
    } catch (e) {
      setError(String(e?.message || e));
      setStatus("error");
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-3">
      <h1 className="text-2xl font-bold">Debug</h1>

      <div className="rounded-md border p-3">
        <div className="font-medium">Auth</div>
        <div className="text-sm text-gray-700">
          {user ? `Signed in as ${user.email || user.uid}` : "Not signed in"}
        </div>
        <div className="mt-2 flex gap-2">
          {!user ? (
            <button onClick={doSignIn} className="px-3 py-2 bg-indigo-600 text-white rounded-md">
              Sign in with Google
            </button>
          ) : (
            <button onClick={doSignOut} className="px-3 py-2 bg-gray-200 rounded-md">
              Sign out
            </button>
          )}
        </div>
      </div>

      <div className="rounded-md border p-3">
        <div className="font-medium">Firestore</div>
        <div className="text-sm text-gray-700 mb-2">
          Status: {status}
        </div>
        <button
          onClick={writeAndRead}
          disabled={!user}
          className="px-3 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
        >
          Write & Read test doc
        </button>
        {lastRead && (
          <pre className="mt-2 text-sm bg-gray-50 p-2 rounded-md overflow-auto">
            {JSON.stringify(lastRead, null, 2)}
          </pre>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </main>
  );
}
