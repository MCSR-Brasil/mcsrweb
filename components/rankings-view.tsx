"use client";

import { normalizeName } from "../lib/normalize";

type Leader = { name: string; earnings: number };

function rankColor(index: number) {
  if (index === 0) return "from-yellow-400 to-amber-500";
  if (index === 1) return "from-zinc-300 to-zinc-400";
  if (index === 2) return "from-amber-700 to-amber-800";
  return "from-emerald-600 to-emerald-700";
}

export function RankingsView({ leaders, uuidMap }: { leaders: Leader[]; uuidMap: Map<string, string> }) {
  return (
    <div className="space-y-3">
      <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">Top Jogadores</h2>
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {leaders.map((p, i) => (
          <PlayerCard key={`${p.name}-${i}`} player={p} rank={i + 1} uuidMap={uuidMap} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, rank, uuidMap }: { player: Leader; rank: number; uuidMap: Map<string, string> }) {
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
  const mapped = uuidMap.get(key);
  const finalUUID = mapped ?? placeholderUUIDs[idx];
  const bustUrl = `https://skins.mcstats.com/bust/${finalUUID}`;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-lg hover:scale-[1.01] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-stretch">
        <div
          className={`relative isolate w-32 sm:w-48 md:w-64 shrink-0 bg-gradient-to-br ${paneColors}`}
          style={{ clipPath: "polygon(0 0, 96% 0, 84% 100%, 0 100%)" }}
        >
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" />
          <div className="relative flex h-full items-center justify-center pl-2 sm:pl-3">
            <img
              src={bustUrl}
              alt={`${player.name} bust`}
              className="h-24 w-24 sm:h-32 sm:w-32 md:h-36 md:w-36 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center" aria-hidden="true">
            <div
              className="text-white text-5xl sm:text-6xl md:text-7xl leading-none"
              style={{ fontFamily: "var(--font-display)" }}
            >
              #{rank}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between p-3 md:p-5">
          <div className="min-w-0">
            <h3 className="truncate text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {player.name}
            </h3>
          </div>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              R${player.earnings.toLocaleString()}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Ganhos Totais</div>
          </div>
        </div>
      </div>
    </div>
  );
}
