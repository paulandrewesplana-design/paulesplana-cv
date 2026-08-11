"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DayBucket } from "@/lib/analytics";
import { Card, CardHeader } from "@/components/ui/Card";

export function RequestChart({ data }: { data: DayBucket[] }) {
  return (
    <Card>
      <CardHeader title="Request volume" subtitle="Requested vs. completed" />
      <div className="h-64 px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="req" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="comp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="requested"
              stroke="#0ea5e9"
              fill="url(#req)"
              strokeWidth={2}
              name="Requested"
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#22c55e"
              fill="url(#comp)"
              strokeWidth={2}
              name="Completed"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
