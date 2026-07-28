import type { StateLeaderboardRow } from "../lib/repositories/states";
import { StateFlag } from "./state-flag";

export function StateLeaderboardList({ rows }: { rows: StateLeaderboardRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map((r, idx) => {
          const pct = Math.round((r.value / max) * 100);
          return (
            <div
              key={r.uf}
              className="rounded-xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    #{idx + 1} <StateFlag uf={r.uf} />
                  </div>
                  <div className="truncate text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{r.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
                    {r.value}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-zinc-500">Players</div>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
