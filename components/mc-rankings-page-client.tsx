"use client";

import { useBackgroundRefresh } from "../hooks/use-background-refresh";
import type { StateLeaderboardRow, StatePlayersByUF } from "../lib/repositories/states";
import type { UUIDMap } from "../lib/uuids";
import { McRankingsView } from "./mc-rankings-view";
import type { PlayerRow } from "./player-leaderboard-view";

type McData = {
  rankedRows: PlayerRow[];
  rsg116Rows: PlayerRow[];
  rsgSsgRows: PlayerRow[];
  stateRows: StateLeaderboardRow[];
  statePlayersByUF: StatePlayersByUF;
  uuidMap: UUIDMap;
};

export function McRankingsPageClient({
  initial,
  defaultMode,
  defaultRsgCategory,
}: {
  initial: McData;
  defaultMode: "rsg" | "ranked" | "states";
  defaultRsgCategory: "1.16" | "1.16 SSG";
}) {
  const { data } = useBackgroundRefresh<McData>(initial, "/api/leaderboards/mc", {
    refreshIntervalMs: 300_000,
  });

  return (
    <McRankingsView
      uuidMap={data.uuidMap}
      rankedRows={data.rankedRows}
      rsg116Rows={data.rsg116Rows}
      rsgSsgRows={data.rsgSsgRows}
      stateRows={data.stateRows}
      statePlayersByUF={data.statePlayersByUF}
      defaultMode={defaultMode}
      defaultRsgCategory={defaultRsgCategory}
    />
  );
}
