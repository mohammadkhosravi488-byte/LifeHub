"use client";

import { useState } from "react";
import { useLifehubData } from "@/lib/data-context";

export default function SettingsPage() {
  const { user, resetData } = useLifehubData();
  const [notes, setNotes] = useState("");

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Manage your LifeHub demo profile and jot down integration ideas.
        </p>
      </header>

      <section className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Profile</h2>
        <dl className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex justify-between">
            <dt>Name</dt>
            <dd className="font-medium">{user?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Email</dt>
            <dd className="font-medium">{user?.email}</dd>
          </div>
        </dl>
        <button
          onClick={resetData}
          className="mt-4 h-9 px-4 rounded-md border border-indigo-400 bg-indigo-50 text-sm font-semibold text-indigo-700 dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-200"
        >
          Reset demo data
        </button>
      </section>

      <section className="rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/70 p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Notes</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Capture ideas for future integrations or permissions you want to test. The text stays in this browser only.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="mt-3 w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-100"
          placeholder="Sync Sentral grades, add Canvas modules, automate work rosters…"
        />
      </section>
    </main>
  );
}
