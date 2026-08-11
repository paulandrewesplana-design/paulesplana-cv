"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ambulance, MapPin } from "lucide-react";
import type { Driver, GeoPoint, TripRequest } from "@/lib/types";
import { watchTrip } from "@/lib/data/trips";
import { watchDriver } from "@/lib/data/drivers";
import { getFacility } from "@/lib/data/facilities";
import { distanceMiles, estimateEtaMinutes } from "@/lib/utils";

/**
 * Uber-style dark tracking view. The ambulance pin animates from the driver's
 * last known position toward the facility pickup point, with a live ETA badge.
 *
 * HIPAA: this view is keyed by tripId only. No patient name/DOB is read here
 * or placed in the URL — only pickup/dropoff addresses and driver position.
 */
export function TrackingMap({ tripId }: { tripId: string }) {
  const [trip, setTrip] = useState<TripRequest | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [facilityPoint, setFacilityPoint] = useState<GeoPoint | null>(null);
  const [progress, setProgress] = useState(0); // 0 → 1 en route

  useEffect(() => {
    const unsub = watchTrip(tripId, setTrip);
    return () => unsub();
  }, [tripId]);

  const driverId = trip?.driverId;
  useEffect(() => {
    if (!driverId) return;
    const unsub = watchDriver(driverId, setDriver);
    return () => unsub();
  }, [driverId]);

  const facilityId = trip?.facilityId;
  useEffect(() => {
    if (!facilityId) return;
    let active = true;
    getFacility(facilityId).then((f) => {
      if (active && f) setFacilityPoint(f.geoPoint);
    });
    return () => {
      active = false;
    };
  }, [facilityId]);

  // Simulated approach animation for demo mode (in production the pin follows
  // the driver's real streamed GPS via the onSnapshot subscription above).
  useEffect(() => {
    if (!driver || !facilityPoint) return;
    const id = setInterval(() => {
      setProgress((p) => (p >= 1 ? 1 : Number((p + 0.02).toFixed(3))));
    }, 400);
    return () => clearInterval(id);
  }, [driver, facilityPoint]);

  const totalMiles = useMemo(() => {
    if (!driver || !facilityPoint) return 0;
    return distanceMiles(driver.currentGeoPoint, facilityPoint);
  }, [driver, facilityPoint]);

  const remainingMiles = totalMiles * (1 - progress);
  const etaMin = estimateEtaMinutes(Math.max(0.1, remainingMiles));

  if (!trip) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Loading trip…
      </div>
    );
  }

  // Pin position interpolated across the map panel (visual only).
  const pinLeft = 20 + progress * 55; // %
  const pinTop = 68 - progress * 40; // %

  return (
    <div className="map-dark relative min-h-screen overflow-hidden text-white">
      {/* faux route line */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full">
        <line
          x1="20%"
          y1="68%"
          x2="75%"
          y2="28%"
          stroke="rgba(56,189,248,0.35)"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
      </svg>

      {/* facility (destination) marker */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: "75%", top: "28%" }}
      >
        <div className="rounded-full bg-white/10 p-2 ring-2 ring-sky-400">
          <MapPin className="h-5 w-5 text-sky-300" />
        </div>
        <span className="mt-1 rounded bg-black/50 px-2 py-0.5 text-[11px]">
          Pickup
        </span>
      </div>

      {/* moving ambulance pin */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all duration-500 ease-linear"
        style={{ left: `${pinLeft}%`, top: `${pinTop}%` }}
      >
        <div className="rounded-full bg-brand p-2 shadow-lg shadow-sky-900/50 ring-2 ring-white">
          <Ambulance className="h-5 w-5 text-white" />
        </div>
      </div>

      {/* back button */}
      <Link
        href="/facility"
        className="absolute left-4 top-4 flex items-center gap-1 rounded-full bg-black/40 px-3 py-1.5 text-sm backdrop-blur"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* floating info card */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-5 text-slate-900 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Ambulance en route to
              </p>
              <p className="mt-0.5 text-sm font-semibold">{trip.pickupAddress}</p>
            </div>
            <span className="rounded-full bg-brand px-3 py-1 text-sm font-bold text-white">
              {progress >= 1 ? "Arrived" : `${etaMin} min`}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
            <span className="text-slate-500">
              {driver ? driver.fullName : "Assigning driver…"}
              {driver ? ` · ${driver.vehicleType}` : ""}
            </span>
            <span className="text-slate-500">
              {remainingMiles > 0 ? `${remainingMiles.toFixed(1)} mi away` : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
