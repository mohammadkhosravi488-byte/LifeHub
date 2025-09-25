"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";

export default function ShareCalendar({ calendarId }) {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");

  const addMember = async () => {
    setInfo("");
    const q = query(collection(db, "profiles"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) { setInfo("No user with that email has signed in yet."); return; }
    const uid = snap.docs[0].data().uid;
    await updateDoc(doc(db, "calendars", calendarId), { memberUids: arrayUnion(uid) });
    setInfo("Added ✔");
    setEmail("");
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        placeholder="Add member by email"
        className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button onClick={addMember} className="px-3 py-2 bg-blue-600 text-white rounded-md">Share</button>
      {info && <span className="text-sm text-gray-700">{info}</span>}
    </div>
  );
}
