"use client";

import { useMemo, useState } from "react";
import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";

type Leader = { name: string; earnings: number };
type Winner = { name: string; amount: number };
type EventRow = {
  event: string;
  prizepool: number | null;
  date: string | null;
  info: string | null;
  winners: Winner[];
};

function rankColor(index: number) {
  if (index === 0) return "from-yellow-400 to-amber-500";
  if (index === 1) return "from-zinc-300 to-zinc-400";
  if (index === 2) return "from-amber-700 to-amber-800";
  return "from-emerald-600 to-emerald-700";
}

export function RankingsView({
  leaders,
  uuidMap,
  events,
}: {
  leaders: Leader[];
  uuidMap: UUIDMap;
  events: EventRow[];
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<Leader | null>(null);

  const selectedBreakdown = useMemo(() => {
    if (!selectedPlayer) return [] as Array<{ event: string; amount: number }>;
    const key = normalizeName(selectedPlayer.name);
    if (!key) return [];

    const rows: Array<{ event: string; amount: number }> = [];
    for (const evt of events) {
      const winners = Array.isArray(evt.winners) ? evt.winners : [];
      for (const w of winners) {
        if (normalizeName(w.name) !== key) continue;
        const amount = Number(w.amount ?? 0);
        rows.push({ event: evt.event, amount: Number.isFinite(amount) ? amount : 0 });
      }
    }

    return rows
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount || a.event.localeCompare(b.event, "pt-BR"));
  }, [events, selectedPlayer]);

  const totalFormatted = useMemo(() => {
    if (!selectedPlayer) return "";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
      selectedPlayer.earnings
    );
  }, [selectedPlayer]);

  return (
    <>
      <div className="space-y-3">
        <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">Top Jogadores</h2>
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {leaders.map((p, i) => (
            <PlayerCard
              key={`${p.name}-${i}`}
              player={p}
              rank={i + 1}
              uuidMap={uuidMap}
              onClick={() => setSelectedPlayer(p)}
            />
          ))}
        </div>
      </div>

      {selectedPlayer ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes de ganhos"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Ganhos</div>
                <div className="mt-2 truncate text-2xl font-black text-zinc-900 dark:text-zinc-50">{selectedPlayer.name}</div>
                <div className="mt-2 text-lg font-black text-emerald-700 dark:text-emerald-400">{totalFormatted}</div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayer(null)}
                className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-zinc-700 transition-colors hover:border-emerald-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500 dark:hover:text-zinc-50"
              >
                Fechar
              </button>
            </div>

            <div className="mt-6 space-y-2">
              {selectedBreakdown.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                  Sem detalhes disponíveis.
                </div>
              ) : (
                selectedBreakdown.map((row, idx) => (
                  <div
                    key={`${row.event}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-base font-extrabold text-zinc-900 dark:text-zinc-50">{row.event}</div>
                    </div>
                    <div className="shrink-0 text-base font-black text-emerald-700 dark:text-emerald-400">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                        maximumFractionDigits: 0,
                      }).format(row.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PlayerCard({
  player,
  rank,
  uuidMap,
  onClick,
}: {
  player: Leader;
  rank: number;
  uuidMap: UUIDMap;
  onClick: () => void;
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
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition-all hover:scale-[1.01] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:focus-visible:ring-offset-zinc-950"
    >
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

        <div className="flex min-w-0 flex-1 items-center justify-between p-3 md:p-5">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-extrabold leading-none text-zinc-900 dark:text-zinc-50 md:text-2xl">{player.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 md:text-3xl">
              R${player.earnings.toLocaleString()}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">Ganhos Totais</div>
          </div>
        </div>
      </div>
    </button>
  );
}
