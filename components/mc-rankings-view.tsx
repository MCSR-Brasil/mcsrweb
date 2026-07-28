"use client";

import { useMemo, useState } from "react";
import { PlayerLeaderboardView, type PlayerRow } from "./player-leaderboard-view";
import { StateLeaderboard } from "./state-leaderboard";
import { StateLeaderboardList } from "./state-leaderboard-list";
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
  const [stateView, setStateView] = useState<"map" | "list">("map");

  const currentRows = useMemo(() => {
    if (mode === "ranked") return rankedRows;
    return rsgCategory === "1.16" ? rsg116Rows : rsgSsgRows;
  }, [mode, rsgCategory, rankedRows, rsg116Rows, rsgSsgRows]);

  const title = mode === "ranked" ? "Top Jogadores (Ranked)" : `Top Jogadores (${rsgCategory})`;
  const valueLabel = mode === "ranked" ? "Elo" : "";
  const valueFormat = mode === "ranked" ? "string" : "time_ms";
  const modeItems: { id: Mode; label: string }[] = [
    { id: "rsg", label: "RSG" },
    { id: "ranked", label: "Ranked" },
    { id: "states", label: "Estados" },
  ];

  const selectorIsland = (
    <div className="space-y-3 rounded-3xl border border-border bg-card p-3 shadow-lg shadow-primary/5 sm:p-4">
      <div className="flex flex-wrap gap-2">
        {modeItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setMode(item.id)}
            className={
              "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all " +
              (mode === item.id
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-border bg-secondary text-secondary-foreground hover:border-primary hover:text-primary")
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
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-bold text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          >
            <option value="1.16">RSG 1.16</option>
            <option value="1.16 SSG">SSG 1.16</option>
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

        {stateView === "map" ? (
          <StateLeaderboard rows={stateRows} playersByUF={statePlayersByUF} uuidMap={uuidMap} embedded withTopOverlay />
        ) : (
          <div className="mx-auto max-w-6xl px-4 pb-12 pt-24 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8">
              <h2 className="font-minecraft mb-6 text-center text-2xl font-black tracking-tight text-card-foreground">
                Ranking por Estados
              </h2>
              <StateLeaderboardList rows={stateRows} />
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6 sm:justify-end sm:px-6">
          <div className="pointer-events-auto inline-flex rounded-full border border-border bg-card p-1 shadow-lg shadow-primary/5">
            {[
              { id: "map", label: "Mapa" },
              { id: "list", label: "Lista" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStateView(item.id as "map" | "list")}
                className={
                  "inline-flex items-center justify-center rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all sm:px-4 sm:py-2 sm:text-xs " +
                  (stateView === item.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-foreground hover:bg-secondary hover:text-primary")
                }
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
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
