"use client";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, getDocs, query, where } from "firebase/firestore";

export async function ensurePersonalCalendar(uid) {
  const q = query(collection(db, "calendars"), where("ownerUid", "==", uid), where("type", "==", "personal"));
  const snap = await getDocs(q);
  if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };
  const ref = await addDoc(collection(db, "calendars"), {
    ownerUid: uid,
    title: "My Calendar",
    type: "personal",
    memberUids: [uid],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: ref.id };
}
