"use client";

import { useState } from "react";
import { Loader2, MapPin, Lock } from "lucide-react";
import type { Facility, SpecialNeed, Urgency } from "@/lib/types";
import { createTrip } from "@/lib/data/trips";
import { findAvailableDrivers, type NearbyDriver } from "@/lib/data/drivers";
import { classNames } from "@/lib/utils";
import { Card, CardHeader } from "@/components/ui/Card";

const SPECIAL_NEEDS: SpecialNeed[] = [
  "Wheelchair",
  "BLS",
  "ALS",
  "Stretcher",
  "No Oxygen",
];

const URGENCIES: { key: Urgency; label: string }[] = [
  { key: "urgent", label: "Urgent / ASAP" },
  { key: "today", label: "Today" },
  { key: "scheduled", label: "Scheduled" },
];

export function BookingForm({ facility }: { facility: Facility }) {
  const [patientName, setPatientName] = useState("");
  const [patientDOB, setPatientDOB] = useState("");
  const [gender, setGender] = useState("");
  const [needs, setNeeds] = useState<SpecialNeed[]>([]);
  const [dropoff, setDropoff] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("today");
  const [providerMode, setProviderMode] = useState<"next" | "specific">("next");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [nearby, setNearby] = useState<NearbyDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const toggleNeed = (need: SpecialNeed): void => {
    setNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );
  };

  const loadDrivers = async (): Promise<void> => {
    setLoadingDrivers(true);
    try {
      const results = await findAvailableDrivers(facility.geoPoint, needs);
      setNearby(results);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const onProviderMode = async (mode: "next" | "specific"): Promise<void> => {
    setProviderMode(mode);
    setSelectedDriverId("");
    if (mode === "specific" && nearby.length === 0) {
      await loadDrivers();
    }
  };

  const canSubmit =
    patientName.trim() !== "" &&
    patientDOB !== "" &&
    dropoff.trim() !== "" &&
    (providerMode === "next" || selectedDriverId !== "");

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const trip = await createTrip({
        facilityId: facility.id,
        patientName: patientName.trim(),
        patientDOB,
        specialNeeds: needs,
        pickupAddress: facility.staticAddress,
        dropoffAddress: dropoff.trim(),
        urgency,
        driverId: providerMode === "specific" ? selectedDriverId : undefined,
      });
      setConfirmation(trip.id);
      // Reset PHI fields immediately after submit.
      setPatientName("");
      setPatientDOB("");
      setGender("");
      setNeeds([]);
      setDropoff("");
      setProviderMode("next");
      setSelectedDriverId("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader title="New transport request" subtitle="Point-to-point booking" />
      <form onSubmit={onSubmit} className="space-y-6 px-5 py-5">
        {/* Locked pickup */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Pickup (facility — locked)
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <Lock className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{facility.staticAddress}</span>
          </div>
        </div>

        {/* Urgency */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Timing &amp; urgency
          </label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCIES.map((u) => (
              <button
                key={u.key}
                type="button"
                onClick={() => setUrgency(u.key)}
                className={classNames(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  urgency === u.key
                    ? "border-brand bg-brand/10 text-brand-dark"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Patient details */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient full name
            </label>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="Full name"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Date of birth
            </label>
            <input
              type="date"
              value={patientDOB}
              onChange={(e) => setPatientDOB(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Select…</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="undisclosed">Undisclosed</option>
            </select>
          </div>
        </div>

        {/* Special needs */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Special needs
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_NEEDS.map((need) => (
              <button
                key={need}
                type="button"
                onClick={() => toggleNeed(need)}
                className={classNames(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  needs.includes(need)
                    ? "border-brand bg-brand/10 text-brand-dark"
                    : "border-slate-200 text-slate-600 hover:border-slate-300",
                )}
              >
                {need}
              </button>
            ))}
          </div>
        </div>

        {/* Dropoff */}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Drop-off address
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-brand">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="w-full text-sm outline-none"
              placeholder="Destination address"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Provider selection */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onProviderMode("next")}
              className={classNames(
                "rounded-lg border px-3 py-2 text-sm font-medium transition",
                providerMode === "next"
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              Next available
            </button>
            <button
              type="button"
              onClick={() => onProviderMode("specific")}
              className={classNames(
                "rounded-lg border px-3 py-2 text-sm font-medium transition",
                providerMode === "specific"
                  ? "border-brand bg-brand/10 text-brand-dark"
                  : "border-slate-200 text-slate-600 hover:border-slate-300",
              )}
            >
              Specific provider
            </button>
          </div>

          {providerMode === "specific" ? (
            <div className="mt-3 space-y-2">
              {loadingDrivers ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Finding nearby
                  ambulances…
                </div>
              ) : nearby.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No available providers match the selected needs right now.
                </p>
              ) : (
                nearby.map(({ driver, miles }) => (
                  <button
                    key={driver.id}
                    type="button"
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={classNames(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition",
                      selectedDriverId === driver.id
                        ? "border-brand bg-brand/10"
                        : "border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <span className="font-medium text-slate-800">
                      {driver.fullName}{" "}
                      <span className="font-normal text-slate-500">
                        · {driver.vehicleType}
                      </span>
                    </span>
                    <span className="text-slate-500">{miles.toFixed(1)} mi</span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        {confirmation ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Request submitted. Trip <code>{confirmation}</code> is now in the
            dispatch queue.
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Request transport
        </button>
      </form>
    </Card>
  );
}
