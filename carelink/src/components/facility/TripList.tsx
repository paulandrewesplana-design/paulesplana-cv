"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TripRequest } from "@/lib/types";
import { watchFacilityTrips } from "@/lib/data/trips";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";
import { TripStatusBadge } from "@/components/ui/StatusBadge";

const ACTIVE: TripRequest["status"][] = ["requested", "accepted", "en_route"];

export function TripList({ facilityId }: { facilityId: string }) {
  const [trips, setTrips] = useState<TripRequest[]>([]);

  useEffect(() => {
    const unsub = watchFacilityTrips(facilityId, setTrips);
    return () => unsub();
  }, [facilityId]);

  return (
    <Card>
      <CardHeader
        title="Recent requests"
        subtitle="Live — updates as drivers accept and complete trips"
      />
      <ul className="divide-y divide-slate-100">
        {trips.length === 0 ? (
          <li className="px-5 py-8 text-center text-sm text-slate-400">
            No requests yet.
          </li>
        ) : (
          trips.map((trip) => {
            const trackable = ACTIVE.includes(trip.status) && trip.driverId;
            return (
              <li key={trip.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    {/* PHI (patient name) shown only to authorized facility
                        staff in the app body — never in the URL. */}
                    <p className="truncate text-sm font-medium text-slate-900">
                      {trip.patientName}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      → {trip.dropoffAddress}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <TripStatusBadge status={trip.status} />
                    <span className="text-[11px] text-slate-400">
                      {formatRelativeTime(trip.createdAt)}
                    </span>
                  </div>
                </div>
                {trip.specialNeeds.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {trip.specialNeeds.map((n) => (
                      <span
                        key={n}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                ) : null}
                {trackable ? (
                  <Link
                    href={`/facility/tracking/${trip.id}`}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    Track live <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
    </Card>
  );
}
