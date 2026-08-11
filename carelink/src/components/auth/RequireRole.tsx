"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Client-side route guard. Redirects unauthenticated users to /login and
 * blocks users whose role does not match. This is a UX gate only — the real
 * data boundary is enforced by Firestore Security Rules (firestore.rules).
 */
export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(
        typeof window !== "undefined" ? window.location.pathname : "/",
      );
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!user) return null; // redirecting

  if (user.role !== role) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <h2 className="text-lg font-semibold text-slate-900">Access denied</h2>
        <p className="text-sm text-slate-600">
          This workspace requires the <strong>{role}</strong> role. You are
          signed in as <strong>{user.role ?? "no role"}</strong>.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
