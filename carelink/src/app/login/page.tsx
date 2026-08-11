"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Ambulance, Loader2, Building2, LineChart } from "lucide-react";
import type { UserRole } from "@/lib/types";
import { useAuth } from "@/lib/auth/AuthProvider";

const ROLE_HOME: Record<UserRole, string> = {
  facility: "/facility",
  ceo: "/ceo",
  driver: "/driver", // delivered in the mobile phase
};

function LoginInner() {
  const { live, signIn, signInDemo } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onEmailSignIn = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(next ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const onDemo = (role: UserRole): void => {
    signInDemo(role);
    router.replace(next ?? ROLE_HOME[role]);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 flex items-center gap-2 text-brand-dark">
        <Ambulance className="h-7 w-7" />
        <span className="text-xl font-bold tracking-tight">CareLink</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Access your facility or fleet workspace.
      </p>

      {live ? (
        <form
          onSubmit={onEmailSignIn}
          className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="you@facility.org"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              autoComplete="current-password"
            />
          </div>
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
          <p className="text-center text-xs text-slate-400">
            Facility accounts are provisioned by CareLink. Contact your admin for
            access.
          </p>
        </form>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <strong>Demo mode</strong> — no Firebase configured. Choose a role to
            explore the app. Add <code>.env.local</code> to enable real email
            sign-in with role-based custom claims.
          </div>
          <button
            onClick={() => onDemo("facility")}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand"
          >
            <Building2 className="h-6 w-6 text-brand" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Continue as Facility
              </p>
              <p className="text-xs text-slate-500">Riverside Rehabilitation Center</p>
            </div>
          </button>
          <button
            onClick={() => onDemo("ceo")}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand"
          >
            <LineChart className="h-6 w-6 text-brand" />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Continue as CEO / Fleet Admin
              </p>
              <p className="text-xs text-slate-500">Fleet analytics dashboard</p>
            </div>
          </button>
        </div>
      )}

      <Link href="/" className="mt-6 text-center text-sm text-slate-400 hover:text-slate-600">
        ← Back home
      </Link>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
