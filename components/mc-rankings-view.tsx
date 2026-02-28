"use client";

import { useMemo, useState } from "react";
import { PlayerLeaderboardView, type PlayerRow } from "./player-leaderboard-view";
import { StateLeaderboard } from "./state-leaderboard";
import type { StateLeaderboardRow, StatePlayersByUF } from "../lib/repositories/states";
import type { UUIDMap } from "../lib/uuids";

type Mode = "rsg" | "ranked" | "states";
type RsgCategory = "1.16" | "1.16 SSG";

export function McRankingsView({
  uuidMap,
  rankedRows,
  rsg116Rows,
  rsgSsgRows,
  stateRows,
  statePlayersByUF,
  defaultMode,
  defaultRsgCategory,
}: {
  uuidMap: UUIDMap;
  rankedRows: PlayerRow[];
  rsg116Rows: PlayerRow[];
  rsgSsgRows: PlayerRow[];
  stateRows: StateLeaderboardRow[];
  statePlayersByUF: StatePlayersByUF;
  defaultMode: Mode;
  defaultRsgCategory: RsgCategory;
}) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [rsgCategory, setRsgCategory] = useState<RsgCategory>(defaultRsgCategory);

  const currentRows = useMemo(() => {
    if (mode === "ranked") return rankedRows;
    return rsgCategory === "1.16" ? rsg116Rows : rsgSsgRows;
  }, [mode, rsgCategory, rankedRows, rsg116Rows, rsgSsgRows]);

  const title = mode === "ranked" ? "Top Jogadores (Ranked)" : `Top Jogadores (${rsgCategory})`;
  const valueLabel = mode === "ranked" ? "Elo" : "";
  const valueFormat = mode === "ranked" ? "number" : "time_ms";
  const modeItems: { id: Mode; label: string }[] = [
    { id: "rsg", label: "RSG" },
    { id: "ranked", label: "Ranked" },
    { id: "states", label: "Estados" },
  ];

  const selectorIsland = (
    <div className="space-y-3 rounded-3xl border border-zinc-200/80 bg-white/90 p-3 shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/85 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {modeItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={
              "rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all " +
              (mode === item.id
                ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
            }
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "rsg" ? (
        <div className="max-w-xs">
          <select
            value={rsgCategory}
            onChange={(e) => setRsgCategory(e.target.value as RsgCategory)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          >
            <option value="1.16">RSG 1.16</option>
            <option value="1.16 SSG">RSG 1.16 SSG</option>
          </select>
        </div>
      ) : null}
    </div>
  );

  if (mode === "states") {
    return (
      <div className="relative left-1/2 right-1/2 w-screen -mx-[50vw] -mt-10 sm:-mt-10">
        <div className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3 sm:px-6">
          <div className="pointer-events-auto w-full max-w-4xl">{selectorIsland}</div>
        </div>

        <StateLeaderboard rows={stateRows} playersByUF={statePlayersByUF} embedded withTopOverlay />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="sticky top-20 z-20">{selectorIsland}</section>

      <PlayerLeaderboardView
        title={title}
        valueLabel={valueLabel}
        rows={currentRows}
        uuidMap={uuidMap}
        valueFormat={valueFormat}
      />
    </div>
  );
}
