import type { DriverStatus, TripStatus } from "@/lib/types";
import { classNames } from "@/lib/utils";

const TRIP_STYLES: Record<TripStatus, string> = {
  requested: "bg-slate-100 text-slate-700",
  accepted: "bg-sky-100 text-sky-800",
  en_route: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

const TRIP_LABELS: Record<TripStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  en_route: "En route",
  completed: "Completed",
  canceled: "Canceled",
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TRIP_STYLES[status],
      )}
    >
      {TRIP_LABELS[status]}
    </span>
  );
}

const DRIVER_DOT: Record<DriverStatus, string> = {
  available: "bg-status-available",
  in_service: "bg-status-inservice",
  on_break: "bg-status-onbreak",
};

const DRIVER_LABEL: Record<DriverStatus, string> = {
  available: "Available",
  in_service: "In service",
  on_break: "On break",
};

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className={classNames("h-2 w-2 rounded-full", DRIVER_DOT[status])} />
      {DRIVER_LABEL[status]}
    </span>
  );
}
