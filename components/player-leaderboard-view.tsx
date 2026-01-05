"use client";

import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";
import { StateFlag } from "./state-flag";

export type PlayerRow = {
  name: string;
  value: number;
  stateUF?: string | null;
};

function rankColor(index: number) {
  if (index === 0) return "from-yellow-400 to-amber-500";
  if (index === 1) return "from-zinc-300 to-zinc-400";
  if (index === 2) return "from-amber-700 to-amber-800";
  return "from-emerald-600 to-emerald-700";
}

export function PlayerLeaderboardView({
  title,
  valueLabel,
  rows,
  uuidMap,
}: {
  title: string;
  valueLabel: string;
  rows: PlayerRow[];
  uuidMap: UUIDMap;
}) {
  return (
    <div className="space-y-3">
      <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {rows.map((p, i) => (
          <PlayerCard
            key={`${p.name}-${i}`}
            player={p}
            rank={i + 1}
            uuidMap={uuidMap}
            valueLabel={valueLabel}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  rank,
  uuidMap,
  valueLabel,
}: {
  player: PlayerRow;
  rank: number;
  uuidMap: UUIDMap;
  valueLabel: string;
}) {
  const paneColors = rankColor(rank - 1);
  const placeholderUUIDs = [
    "7601ed6f-f96d-4d1c-aa8b-f08fdab2a1d0",
    "069a79f4-44e9-4726-a5be-fca90e38aaf5",
    "853c80ef-3c37-49fd-aa49-938b674adae6",
    "4566e69f-c907-48ee-8d71-d7ba5aa00d20",
  ];
  let hash = 0;
  for (let i = 0; i < player.name.length; i++) hash = (hash * 31 + player.name.charCodeAt(i)) >>> 0;
  const idx = hash % placeholderUUIDs.length;
  const key = normalizeName(player.name);
  const mapped = uuidMap[key];
  const finalUUID = mapped ?? placeholderUUIDs[idx];
  const bustUrl = `https://skins.mcstats.com/bust/${finalUUID}`;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:scale-[1.01] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-stretch">
        <div
          className={`relative isolate w-32 shrink-0 bg-gradient-to-br ${paneColors} sm:w-48 md:w-64`}
          style={{ clipPath: "polygon(0 0, 96% 0, 84% 100%, 0 100%)" }}
        >
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" />
          <div className="relative flex h-full items-center justify-center pl-2 sm:pl-3">
            <img
              src={bustUrl}
              alt={`${player.name} bust`}
              className="h-24 w-24 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)] sm:h-32 sm:w-32 md:h-36 md:w-36"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center" aria-hidden="true">
            <div
              className="text-5xl leading-none text-white sm:text-6xl md:text-7xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              #{rank}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 p-3 md:p-5">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="truncate text-xl font-extrabold text-zinc-900 dark:text-zinc-50 md:text-2xl">
                {player.name}
              </h3>
              {player.stateUF ? <StateFlag uf={player.stateUF} /> : null}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 md:text-3xl">
              {player.value.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">{valueLabel}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
