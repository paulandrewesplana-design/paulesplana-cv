import { ClipboardList, CheckCircle2, Timer, XCircle } from "lucide-react";
import type { KpiTotals } from "@/lib/analytics";
import { Card } from "@/components/ui/Card";

export function KpiCards({ totals }: { totals: KpiTotals }) {
  const items = [
    {
      label: "Total requests",
      value: totals.total,
      icon: ClipboardList,
      tint: "text-slate-500",
    },
    {
      label: "Completed",
      value: totals.completed,
      icon: CheckCircle2,
      tint: "text-green-600",
    },
    {
      label: "In progress",
      value: totals.inProgress,
      icon: Timer,
      tint: "text-indigo-600",
    },
    {
      label: "Canceled",
      value: totals.canceled,
      icon: XCircle,
      tint: "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {item.label}
              </span>
              <Icon className={`h-4 w-4 ${item.tint}`} />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </Card>
        );
      })}
    </div>
  );
}
