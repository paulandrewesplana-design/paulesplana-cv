"use client";

import { useEffect, useMemo, useState } from "react";
import type { Driver, DriverRating, TripRequest } from "@/lib/types";
import {
  bucketByDay,
  buildHeatCells,
  computeDriverPerformance,
  computeKpis,
  withinTimeframe,
  type Timeframe,
} from "@/lib/analytics";
import { watchAllTrips } from "@/lib/data/trips";
import { watchDrivers } from "@/lib/data/drivers";
import { watchRatings } from "@/lib/data/ratings";
import { KpiCards } from "./KpiCards";
import { TimeframeFilter } from "./TimeframeFilter";
import { RequestChart } from "./RequestChart";
import { DriverRatings } from "./DriverRatings";
import { ProviderLeaderboard } from "./ProviderLeaderboard";
import { Heatmap } from "./Heatmap";

const CHART_DAYS: Record<Timeframe, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  annual: 365,
};

export function CeoDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");
  const [trips, setTrips] = useState<TripRequest[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [ratings, setRatings] = useState<DriverRating[]>([]);

  useEffect(() => {
    const unsubs = [
      watchAllTrips(setTrips),
      watchDrivers(setDrivers),
      watchRatings(setRatings),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const scopedTrips = useMemo(
    () => trips.filter((t) => withinTimeframe(t, timeframe)),
    [trips, timeframe],
  );
  const scopedRatings = useMemo(
    () =>
      ratings.filter((r) => {
        const cutoffDays = CHART_DAYS[timeframe];
        return (
          new Date(r.createdAt).getTime() >=
          Date.now() - cutoffDays * 86400000
        );
      }),
    [ratings, timeframe],
  );

  const kpis = useMemo(() => computeKpis(scopedTrips), [scopedTrips]);
  const chartData = useMemo(
    () => bucketByDay(scopedTrips, Math.min(CHART_DAYS[timeframe], 30)),
    [scopedTrips, timeframe],
  );
  const performance = useMemo(
    () => computeDriverPerformance(drivers, scopedRatings, scopedTrips),
    [drivers, scopedRatings, scopedTrips],
  );
  const heatCells = useMemo(() => {
    // Approximate each dispatch origin from its assigned/ nearest driver's
    // position; falls back to any driver location as a demo signal.
    const points = scopedTrips.map((t): [number, number] => {
      const d = drivers.find((dr) => dr.id === t.driverId);
      return d ? d.currentGeoPoint : [38.5749 + Math.random() * 0.05, -121.48];
    });
    return buildHeatCells(points, 2);
  }, [scopedTrips, drivers]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Fleet overview</h1>
        <TimeframeFilter value={timeframe} onChange={setTimeframe} />
      </div>

      <KpiCards totals={kpis} />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <RequestChart data={chartData} />
        <ProviderLeaderboard drivers={drivers} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DriverRatings rows={performance} />
        <Heatmap cells={heatCells} />
      </div>
    </div>
  );
}
