import Link from "next/link";
import { Ambulance } from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";

export function AppHeader({ role }: { role: "Facility" | "CEO / Fleet Admin" }) {
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
          <span className="text-sm font-medium text-slate-600">{role}</span>
        </div>
      </div>
    </header>
  );
}
