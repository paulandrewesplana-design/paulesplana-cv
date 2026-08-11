"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ambulance, LogOut } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/lib/auth/AuthProvider";

export function AppHeader({ role }: { role: "Facility" | "CEO / Fleet Admin" }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const onSignOut = async (): Promise<void> => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-brand-dark">
          <Ambulance className="h-6 w-6" />
          <span className="font-bold tracking-tight">CareLink</span>
        </Link>
        <div className="flex items-center gap-3">
          {!isFirebaseConfigured ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Demo data
            </span>
          ) : null}
          <span className="hidden text-sm font-medium text-slate-600 sm:inline">
            {role}
          </span>
          {user ? (
            <>
              {user.email ? (
                <span className="hidden text-xs text-slate-400 md:inline">
                  {user.email}
                </span>
              ) : null}
              <button
                onClick={onSignOut}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
