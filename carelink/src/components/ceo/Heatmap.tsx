import type { HeatCell } from "@/lib/analytics";
import { Card, CardHeader } from "@/components/ui/Card";

/**
 * Lightweight spatial density heatmap. Renders dispatch-origin geo-cells onto
 * a normalized panel so high-demand clusters are visible without a full
 * mapping SDK. In production this panel is backed by Mapbox GL heatmap layers.
 */
export function Heatmap({ cells }: { cells: HeatCell[] }) {
  const maxCount = cells.reduce((m, c) => Math.max(m, c.count), 1);

  const lats = cells.map((c) => c.lat);
  const lngs = cells.map((c) => c.lng);
  const minLat = Math.min(...lats, 0);
  const maxLat = Math.max(...lats, 1);
  const minLng = Math.min(...lngs, 0);
  const maxLng = Math.max(...lngs, 1);

  const norm = (v: number, lo: number, hi: number): number =>
    hi === lo ? 0.5 : (v - lo) / (hi - lo);

  return (
    <Card>
      <CardHeader
        title="Dispatch heatmap"
        subtitle="High-density request clusters across the service region"
      />
      <div className="map-dark relative m-4 h-64 overflow-hidden rounded-lg">
        {cells.map((cell, i) => {
          const intensity = cell.count / maxCount;
          const left = norm(cell.lng, minLng, maxLng) * 84 + 8;
          const top = (1 - norm(cell.lat, minLat, maxLat)) * 84 + 8;
          const size = 40 + intensity * 70;
          return (
            <div
              key={`${cell.lat},${cell.lng}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                background: `radial-gradient(circle, rgba(239,68,68,${
                  0.15 + intensity * 0.55
                }) 0%, rgba(239,68,68,0) 70%)`,
              }}
            />
          );
        })}
        {cells.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No dispatch data in range.
          </div>
        ) : null}
      </div>
    </Card>
  );
}
