"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";
import type { StateLeaderboardRow, StatePlayerRow } from "../lib/repositories/states";
import { StateMap } from "./state-map";

const CATEGORIES = ["1.16", "1.16 SSG"] as const;

export function StateLeaderboard({ rows, uuidMap }: { rows: StateLeaderboardRow[]; uuidMap: UUIDMap }) {
  const defaultSelected = useMemo(() => rows[0] ?? null, [rows]);
  const [selectedUF, setSelectedUF] = useState<string>(defaultSelected?.uf ?? "SP");
  const [selectedName, setSelectedName] = useState<string>(defaultSelected?.name ?? "São Paulo");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("1.16");

  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<StatePlayerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(
          `/api/states/${encodeURIComponent(selectedUF)}/players`,
          window.location.origin
        );
        url.searchParams.set("category", selectedCategory);

        const res = await fetch(url.toString(), {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { rows: StatePlayerRow[] };
        if (!cancelled) setPlayers(Array.isArray(json.rows) ? json.rows : []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedUF, selectedCategory]);

  return (
    <div
      className="relative left-1/2 right-1/2 w-screen -mx-[50vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white/50 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/30"
      style={{ height: "calc(100dvh - 160px)" }}
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

      <button
        type="button"
        onClick={() => setSidebarOpen((s) => !s)}
        className="absolute left-4 top-4 rounded-lg border border-zinc-200 bg-white/80 px-3 py-2 text-xs font-black text-zinc-800 shadow-sm backdrop-blur-sm transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/70 dark:text-zinc-100 dark:hover:bg-zinc-950 font-minecraft"
      >
        {sidebarOpen ? "Ocultar" : "Ranking"}
      </button>

      <aside
        className={
          "absolute right-0 top-0 h-full w-[min(92vw,420px)] border-l border-zinc-200 bg-white/85 shadow-xl backdrop-blur-sm transition-transform dark:border-zinc-800 dark:bg-zinc-950/80 " +
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
                <div className="mt-1 truncate text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 font-minecraft">
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

            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={
                    "rounded-lg border px-3 py-2 text-xs font-black uppercase tracking-wider shadow-sm transition-all font-minecraft " +
                    (cat === selectedCategory
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800")
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[52px] w-full animate-pulse rounded-lg border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-900/70"
                  />
                ))}
              </div>
            ) : error ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">Erro: {error}</div>
            ) : players.length === 0 ? (
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
                    uuidMap={uuidMap}
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
  uuidMap,
}: {
  rank: number;
  name: string;
  timeMs: number;
  link: string | null;
  uuidMap: UUIDMap;
}) {
  const uuid = uuidMap[normalizeName(name)];
  const img = uuid ? `https://skins.mcstats.com/face/${uuid}` : null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-7 text-center text-sm font-black text-zinc-500 dark:text-zinc-400">#{rank}</div>
        {img ? (
          <img
            src={img}
            alt={name}
            className="h-8 w-8 rounded-md border border-zinc-200 dark:border-zinc-700"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="truncate text-sm font-extrabold text-zinc-900 dark:text-zinc-50">{name}</div>
      </div>

      <div className="text-right">
        <div className="text-sm font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
          {formatTimeMs(timeMs)}
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
  const millis = Math.max(0, ms % 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}
