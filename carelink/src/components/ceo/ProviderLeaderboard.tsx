import type { Driver } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { DriverStatusBadge } from "@/components/ui/StatusBadge";

export function ProviderLeaderboard({ drivers }: { drivers: Driver[] }) {
  const activeCount = drivers.filter((d) => d.status !== "on_break").length;

  return (
    <Card>
      <CardHeader
        title="Fleet units"
        subtitle={`${activeCount} of ${drivers.length} active`}
      />
      <ul className="divide-y divide-slate-100">
        {drivers.map((driver) => (
          <li key={driver.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {driver.fullName}
              </p>
              <p className="text-xs text-slate-500">{driver.vehicleType}</p>
            </div>
            <DriverStatusBadge status={driver.status} />
          </li>
        ))}
      </ul>
    </Card>
  );
}
