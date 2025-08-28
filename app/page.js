import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import TodoList from "@/components/TodoList";
import Upcoming from "@/components/Upcoming";
import AddEvent from "@/components/AddEvent";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col gap-8 w-full max-w-2xl p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-4xl font-bold text-indigo-700 tracking-tight text-center">
          Welcome to LifeHub 🎉
        </h1>

        {/* Sign in / Sign out */}
        <div className="self-center">
          <AuthButtons />
        </div>

        {/* Quick actions / nav */}
        <div className="w-full flex items-center gap-3">
          <Link
            href="/import"
            className="inline-block px-3 py-2 rounded-md bg-indigo-600 text-white text-sm"
          >
            Import from .ics
          </Link>
          <Link
            href="/settings"
            className="inline-block px-3 py-2 rounded-md bg-gray-200 text-gray-800 text-sm"
          >
            Settings
          </Link>
        </div>

        {/* Upcoming events */}
        <section className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Upcoming</h2>
          <Upcoming />
        </section>

        {/* Add event */}
        <section className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Add Event</h2>
          <AddEvent />
        </section>

        {/* To-dos */}
        <section className="w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your To-Dos</h2>
          <TodoList />
        </section>
      </div>
    </main>
  );
}
