"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Facility } from "@/lib/types";
import { getFacility } from "@/lib/data/facilities";
import { useAuth } from "@/lib/auth/AuthProvider";
import { AppHeader } from "@/components/ui/AppHeader";
import { BookingForm } from "@/components/facility/BookingForm";
import { TripList } from "@/components/facility/TripList";

/**
 * Facility workspace. The facility is resolved from the authenticated user's
 * `facilityId` custom claim — never chosen client-side — so staff only ever
 * see and book for their own locked facility.
 */
export function FacilityWorkspace() {
  const { user } = useAuth();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);

  const facilityId = user?.facilityId;

  useEffect(() => {
    if (!facilityId) {
      setLoading(false);
      return;
    }
    let active = true;
    getFacility(facilityId).then((f) => {
      if (!active) return;
      setFacility(f);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [facilityId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!facilityId || !facility) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No facility linked
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Your account isn&apos;t associated with a facility yet. Contact your
          CareLink administrator to link your facility.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AppHeader role="Facility" />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{facility.name}</h1>
          <p className="text-sm text-slate-500">{facility.staticAddress}</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <BookingForm facility={facility} />
          <TripList facilityId={facility.id} />
        </div>
      </main>
    </div>
  );
}
