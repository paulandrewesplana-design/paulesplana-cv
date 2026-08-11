import { Star } from "lucide-react";
import type { DriverPerformance } from "@/lib/analytics";
import { Card, CardHeader } from "@/components/ui/Card";
import { classNames } from "@/lib/utils";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={classNames(
            "h-3.5 w-3.5",
            n <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300",
          )}
        />
      ))}
    </div>
  );
}

export function DriverRatings({ rows }: { rows: DriverPerformance[] }) {
  return (
    <Card>
      <CardHeader
        title="Daily driver ratings"
        subtitle="Facility-submitted quality feedback"
      />
      <ul className="divide-y divide-slate-100">
        {rows.map(({ driver, averageRating, ratingCount, completedTrips }) => (
          <li key={driver.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {driver.fullName}
              </p>
              <p className="text-xs text-slate-500">
                {driver.vehicleType} · {completedTrips} completed
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                <Stars value={averageRating} />
                <span className="text-sm font-semibold text-slate-800">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {ratingCount} rating{ratingCount === 1 ? "" : "s"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
