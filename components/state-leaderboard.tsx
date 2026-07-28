"use client";

import { useEffect, useMemo, useState } from "react";
import type { StateLeaderboardRow, StatePlayerRow, StatePlayersByUF } from "../lib/repositories/states";
import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";
import { StateFlag } from "./state-flag";
import { StateMap } from "./state-map";

type StateCategory = "rsg" | "ssg";

export function StateLeaderboard({
  rows,
  playersByUF,
  uuidMap,
  stateCategory = "rsg",
  onStateCategoryChange,
  embedded = false,
  withTopOverlay = false,
}: {
  rows: StateLeaderboardRow[];
  playersByUF: StatePlayersByUF;
  uuidMap?: UUIDMap;
  stateCategory?: StateCategory;
  onStateCategoryChange?: (category: StateCategory) => void;
  embedded?: boolean;
  withTopOverlay?: boolean;
}) {
  const defaultSelected = useMemo(() => rows.find((r) => r.value > 0) ?? rows[0] ?? null, [rows]);
  const [selectedUF, setSelectedUF] = useState<string>(defaultSelected?.uf ?? "SP");
  const [selectedName, setSelectedName] = useState<string>(defaultSelected?.name ?? "São Paulo");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const players = useMemo(() => playersByUF[selectedUF] ?? [], [playersByUF, selectedUF]);

  useEffect(() => {
    if (!embedded) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [embedded]);

  return (
    <div
      className={[
        "relative flex h-[calc(100dvh-76px)] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white/60 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/40",
        embedded ? "" : "max-h-[720px]",
      ].join(" ")}
    >
      <div className="relative min-w-0 flex-1">
        <StateMap
          rows={rows}
          selectedUF={selectedUF}
          onSelect={(uf: string, name: string) => {
            setSelectedUF(uf);
            setSelectedName(name);
            setSidebarOpen(true);
          }}
          className="h-full w-full rounded-none border-0 bg-transparent shadow-none backdrop-blur-0 dark:bg-transparent"
        />
      </div>

      <aside
        className={[
          "z-20 flex flex-col border-zinc-200 bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300 ease-out dark:border-zinc-800 dark:bg-zinc-950/95",
          "absolute inset-y-0 right-0 border-l lg:static",
          sidebarOpen
            ? "w-[min(92vw,520px)] translate-x-0 lg:w-[520px]"
            : "w-0 translate-x-full lg:hidden",
          withTopOverlay
            ? "top-20 h-[calc(100%-5rem)] rounded-l-2xl lg:top-0 lg:h-full lg:rounded-none"
            : "h-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">
                  Estado selecionado
                </div>
                <div className="font-minecraft mt-1 flex items-center gap-3 text-2xl font-black tracking-tight text-card-foreground">
                  <StateFlag uf={selectedUF} className="h-7 w-10 rounded border border-border object-cover shadow-sm" />
                  <span className="truncate">{selectedName}</span>
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {players.length} jogador{players.length === 1 ? "" : "es"}
                </div>
                {onStateCategoryChange ? (
                  <div className="mt-2 inline-flex rounded-xl border border-border bg-secondary p-1">
                    {[
                      { id: "rsg" as const, label: "RSG 1.16" },
                      { id: "ssg" as const, label: "SSG 1.16" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onStateCategoryChange(item.id)}
                        className={
                          "rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all " +
                          (stateCategory === item.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-secondary-foreground hover:bg-background hover:text-foreground")
                        }
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-border bg-card p-2 text-xs font-black text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 sm:p-5">
            {players.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <div className="text-sm font-semibold text-foreground">
                  Sem dados para este estado.
                </div>
                <div className="text-xs text-muted-foreground">
                  Clique em outro estado no mapa para ver seu ranking.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {players.map((p, idx) => (
                  <SidebarPlayerRow
                    key={`${p.name}-${idx}`}
                    rank={idx + 1}
                    player={p}
                    category={stateCategory}
                    uuidMap={uuidMap}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-border bg-card p-3 text-lg font-black text-foreground shadow-lg shadow-primary/5 transition-all hover:scale-105 hover:border-primary hover:text-primary"
          aria-label="Abrir ranking"
        >
          ◀
        </button>
      )}
    </div>
  );
}

function SidebarPlayerRow({
  rank,
  player,
  category,
  uuidMap,
}: {
  rank: number;
  player: StatePlayerRow;
  category: StateCategory;
  uuidMap?: UUIDMap;
}) {
  const name = player.name;
  const rsg = { timeMs: player.rsgTimeMs, link: player.rsgLink, achievedAt: player.rsgAchievedAt };
  const ssg = { timeMs: player.ssgTimeMs, link: player.ssgLink, achievedAt: player.ssgAchievedAt };
  const selected = category === "rsg" ? rsg : ssg;
  const fallback = category === "rsg" ? ssg : rsg;
  const timeMs = selected.timeMs ?? fallback.timeMs ?? player.timeMs;
  const link = selected.link ?? fallback.link ?? player.link ?? null;
  const achievedAt = selected.achievedAt ?? fallback.achievedAt ?? player.achievedAt ?? null;
  const isFallback = selected.timeMs == null && fallback.timeMs != null;

  const skinUrl = useMemo(() => skinAvatarUrl(name, uuidMap), [name, uuidMap]);

  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm transition-all hover:border-primary hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black tabular-nums",
            rankColor(rank),
          ].join(" ")}
        >
          #{rank}
        </div>
        {skinUrl ? (
          <img
            src={skinUrl}
            alt={`${name} head`}
            className="h-12 w-12 rounded-xl border border-border bg-secondary object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="truncate text-base font-extrabold text-card-foreground">{name}</div>
      </div>

      <div className="text-right">
        <div className="text-base font-extrabold tracking-tight text-primary">
          {formatTimeMs(timeMs)}
        </div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            Link
          </a>
        ) : (
          <div className="text-xs uppercase tracking-wider text-muted-foreground">PB</div>
        )}
      </div>
    </div>
  );
}

function skinAvatarUrl(name: string, uuidMap?: UUIDMap): string | null {
  const rawName = String(name ?? "").trim();
  if (!rawName) return null;
  const uuid = uuidMap?.[normalizeName(rawName)];
  if (uuid) return `https://mc-heads.net/avatar/${encodeURIComponent(uuid)}/64`;
  return `https://mc-heads.net/avatar/${encodeURIComponent(rawName)}/64`;
}

function rankColor(rank: number): string {
  if (rank === 1) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  if (rank === 2) return "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  if (rank === 3) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-primary/10 text-primary";
}

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

