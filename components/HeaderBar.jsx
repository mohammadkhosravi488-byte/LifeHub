"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function HeaderBar() {
  const [user, setUser] = useState(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  return (
    <header className="max-w-[1600px] mx-auto px-6 pt-6">
      <div className="flex items-center justify-center relative">
        <h1 className="text-[44px] font-bold text-center">Welcome to LifeHub</h1>
        <Link
          href="/settings"
          className="absolute right-0 flex items-center gap-2 group"
          aria-label="Open settings"
        >
          <span className="text-sm font-semibold">
            {user ? `Hello ${user.displayName || "there"}` : "Sign in"}
          </span>
          <div className="h-10 w-10 rounded-full overflow-hidden border">
            {/* fallback avatar */}
            <img
              src={user?.photoURL || "https://api.dicebear.com/9.x/initials/svg?seed=LH"}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </div>
    </header>
  );
}
