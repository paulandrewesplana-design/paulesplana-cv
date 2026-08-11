/**
 * Pure aggregation helpers for the CEO dashboard. Kept side-effect free and
 * fully typed so they are trivially unit-testable.
 */
import type { Driver, DriverRating, TripRequest } from "./types";

export type Timeframe = "daily" | "weekly" | "monthly" | "quarterly" | "annual";

export const TIMEFRAMES: { key: Timeframe; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "quarterly", label: "Quarterly" },
  { key: "annual", label: "Annual" },
];

const WINDOW_DAYS: Record<Timeframe, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  annual: 365,
};

export function withinTimeframe(
  trip: TripRequest,
  timeframe: Timeframe,
  now: Date = new Date(),
): boolean {
  const created = new Date(trip.createdAt).getTime();
  const cutoff = now.getTime() - WINDOW_DAYS[timeframe] * 86400000;
  return created >= cutoff;
}

export interface KpiTotals {
  total: number;
  completed: number;
  inProgress: number;
  canceled: number;
}

export function computeKpis(trips: TripRequest[]): KpiTotals {
  const totals: KpiTotals = { total: 0, completed: 0, inProgress: 0, canceled: 0 };
  for (const t of trips) {
    totals.total += 1;
    if (t.status === "completed") totals.completed += 1;
    else if (t.status === "canceled") totals.canceled += 1;
    else totals.inProgress += 1; // requested | accepted | en_route
  }
  return totals;
}

export interface DriverPerformance {
  driver: Driver;
  averageRating: number;
  ratingCount: number;
  completedTrips: number;
}

export function computeDriverPerformance(
  drivers: Driver[],
  ratings: DriverRating[],
  trips: TripRequest[],
): DriverPerformance[] {
  return drivers
    .map((driver) => {
      const driverRatings = ratings.filter((r) => r.driverId === driver.id);
      const ratingCount = driverRatings.length;
      const averageRating =
        ratingCount === 0
          ? driver.ratingAverage
          : driverRatings.reduce((s, r) => s + r.rating, 0) / ratingCount;
      const completedTrips = trips.filter(
        (t) => t.driverId === driver.id && t.status === "completed",
      ).length;
      return {
        driver,
        averageRating: Number(averageRating.toFixed(2)),
        ratingCount,
        completedTrips,
      };
    })
    .sort((a, b) => b.averageRating - a.averageRating);
}

/** Bucket trips per day for a small time-series chart. */
export interface DayBucket {
  label: string;
  requested: number;
  completed: number;
  canceled: number;
}

export function bucketByDay(
  trips: TripRequest[],
  days: number,
  now: Date = new Date(),
): DayBucket[] {
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 86400000);
    buckets.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      requested: 0,
      completed: 0,
      canceled: 0,
    });
  }
  const startOfDay = (ms: number): number => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const todayStart = startOfDay(now.getTime());
  for (const t of trips) {
    const created = startOfDay(new Date(t.createdAt).getTime());
    const idx = days - 1 - Math.round((todayStart - created) / 86400000);
    const bucket = buckets[idx];
    if (!bucket) continue;
    bucket.requested += 1;
    if (t.status === "completed") bucket.completed += 1;
    if (t.status === "canceled") bucket.canceled += 1;
  }
  return buckets;
}

/** Group trip origins into coarse geo-cells for a density heatmap. */
export interface HeatCell {
  lat: number;
  lng: number;
  count: number;
}

export function buildHeatCells(
  points: Array<[number, number]>,
  precision = 2,
): HeatCell[] {
  const cells = new Map<string, HeatCell>();
  const round = (n: number): number => Number(n.toFixed(precision));
  for (const [lat, lng] of points) {
    const key = `${round(lat)},${round(lng)}`;
    const existing = cells.get(key);
    if (existing) existing.count += 1;
    else cells.set(key, { lat: round(lat), lng: round(lng), count: 1 });
  }
  return [...cells.values()].sort((a, b) => b.count - a.count);
}
