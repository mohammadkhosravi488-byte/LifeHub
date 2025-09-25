// lib/calendars.js
import { db } from "@/lib/firebase";
import {
  addDoc, collection, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove, getDoc,
} from "firebase/firestore";

/**
 * Creates a calendar owned by the current user.
 * @param {Object} p
 * @param {import('firebase/auth').User} p.user
 * @param {string} p.name
 * @param {string} p.color
 * @param {Array<{email:string, role:'viewer'|'editor'}>} p.invites
 */
export async function createCalendar({ user, name, color = "#4f46e5", invites = [] }) {
  if (!user) throw new Error("Not signed in");
  const payload = {
    name,
    color,
    ownerId: user.uid,
    ownerEmail: user.email || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    // simple sharing model
    members: [
      { uid: user.uid, email: user.email || null, role: "owner" },
      ...invites.map((i) => ({ uid: null, email: i.email.trim().toLowerCase(), role: i.role || "viewer" })),
    ],

    // convenience fields for rules/queries
    invitedEmails: invites.map((i) => i.email.trim().toLowerCase()),
  };

  const ref = await addDoc(collection(db, "calendars"), payload);
  return ref.id;
}

/**
 * Adds/removes a member by email (keeps both members[] and invitedEmails[] in sync).
 * @param {string} calendarId
 * @param {'add'|'remove'} action
 * @param {{email:string, role?:'viewer'|'editor'}} member
 */
export async function updateShare(calendarId, action, member) {
  const cRef = doc(db, "calendars", calendarId);
  const snap = await getDoc(cRef);
  if (!snap.exists()) throw new Error("Calendar not found");

  const email = (member.email || "").trim().toLowerCase();

  if (action === "add") {
    await updateDoc(cRef, {
      members: arrayUnion({ uid: null, email, role: member.role || "viewer" }),
      invitedEmails: arrayUnion(email),
      updatedAt: serverTimestamp(),
    });
  } else {
    await updateDoc(cRef, {
      members: arrayRemove({ uid: null, email, role: member.role || "viewer" }),
      invitedEmails: arrayRemove(email),
      updatedAt: serverTimestamp(),
    });
  }
}
