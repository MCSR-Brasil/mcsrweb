"use client";

import { useEffect, useMemo, useState } from "react";
import type { StateLeaderboardRow, StatePlayersByUF } from "../lib/repositories/states";
import { StateMap } from "./state-map";

export function StateLeaderboard({
  rows,
  playersByUF,
  embedded = false,
  withTopOverlay = false,
}: {
  rows: StateLeaderboardRow[];
  playersByUF: StatePlayersByUF;
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
      className={
        "relative overflow-hidden border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/30 " +
        (embedded
          ? "left-1/2 right-1/2 w-screen -mx-[50vw] rounded-none border-x-0"
          : "left-1/2 right-1/2 w-screen -mx-[50vw] rounded-2xl")
      }
      style={{ height: embedded ? "calc(100dvh - 76px)" : "calc(100dvh - 160px)" }}
    >
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


      <aside
        className={
          "absolute right-0 z-20 w-[min(92vw,520px)] border-l border-zinc-200 bg-white/88 shadow-xl backdrop-blur-sm transition-transform dark:border-zinc-800 dark:bg-zinc-950/85 " +
          (withTopOverlay ? "top-24 h-[calc(100%-6rem)] rounded-tl-2xl" : "top-0 h-full ") +
          (sidebarOpen ? "translate-x-0" : "translate-x-full")
        }
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Estado selecionado
                </div>
                <div className="mt-1 whitespace-normal break-words text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-minecraft">
                  {selectedName} ({selectedUF})
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>

            <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
              Categoria: RSG 1.16
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {players.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Sem dados para este estado.</div>
            ) : (
              <div className="space-y-2">
                {players.map((p, idx) => (
                  <SidebarPlayerRow
                    key={`${p.name}-${idx}`}
                    rank={idx + 1}
                    name={p.name}
                    timeMs={p.timeMs}
                    link={p.link ?? null}
                    format="time_ms"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SidebarPlayerRow({
  rank,
  name,
  timeMs,
  link,
  format,
}: {
  rank: number;
  name: string;
  timeMs: number;
  link: string | null;
  format: "number" | "time_ms";
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-600/50">
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-9 rounded-md bg-zinc-100 py-1 text-center text-sm font-black tabular-nums text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          #{rank}
        </div>
        <div className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{name}</div>
      </div>

      <div className="text-right">
        <div className="text-sm font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          {format === "number" ? Number(timeMs ?? 0).toLocaleString("pt-BR") : formatTimeMs(timeMs)}
        </div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-400"
          >
            Link
          </a>
        ) : (
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">PB</div>
        )}
      </div>
    </div>
  );
}

function formatTimeMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

