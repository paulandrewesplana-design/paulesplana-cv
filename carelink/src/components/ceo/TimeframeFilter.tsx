import { TIMEFRAMES, type Timeframe } from "@/lib/analytics";
import { classNames } from "@/lib/utils";

export function TimeframeFilter({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.key}
          type="button"
          onClick={() => onChange(tf.key)}
          className={classNames(
            "rounded-md px-3 py-1.5 text-sm font-medium transition",
            value === tf.key
              ? "bg-brand text-white"
              : "text-slate-600 hover:bg-slate-50",
          )}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
