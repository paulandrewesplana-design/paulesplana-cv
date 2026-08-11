import Link from "next/link";
import { Building2, LineChart, Ambulance } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <div className="mb-2 flex items-center gap-2 text-brand-dark">
        <Ambulance className="h-7 w-7" />
        <span className="text-xl font-bold tracking-tight">CareLink</span>
      </div>
      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
        Non-Emergency Medical Transportation
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        On-demand, point-to-point transport connecting healthcare facilities with
        ambulance providers. Choose a workspace to open its dashboard.
      </p>

      <div className="mt-5">
        <Link
          href="/login"
          className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Sign in →
        </Link>
      </div>

      {!isFirebaseConfigured ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Running in <strong>demo mode</strong> with seeded data — no Firebase
          configured. Add <code>.env.local</code> to connect Cloud Firestore.
        </div>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/facility"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <Building2 className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Facility Portal
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Book point-to-point transport, choose providers, and track ambulances
            live.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand group-hover:underline">
            Open /facility →
          </span>
        </Link>

        <Link
          href="/ceo"
          className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand hover:shadow-md"
        >
          <LineChart className="h-8 w-8 text-brand" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            CEO / Fleet Admin
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            KPIs, timeframe reporting, driver ratings, and dispatch heatmap
            analytics.
          </p>
          <span className="mt-4 inline-block text-sm font-medium text-brand group-hover:underline">
            Open /ceo →
          </span>
        </Link>
      </div>

      <p className="mt-10 text-xs text-slate-400">
        Driver mobile app is delivered in a later phase.
      </p>
    </main>
  );
}
