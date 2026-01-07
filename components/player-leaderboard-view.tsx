"use client";

import { useEffect, useMemo, useState } from "react";

import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";
import { StateFlag } from "./state-flag";

export type PlayerRow = {
  name: string;
  value: number;
  stateUF?: string | null;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

type ValueFormat = "number" | "time_ms";

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
  valueFormat,
}: {
  title: string;
  valueLabel: string;
  rows: PlayerRow[];
  uuidMap: UUIDMap;
  valueFormat?: ValueFormat;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PlayerRow | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSelected(null);
      }
    }
    if (open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const selectedEmbed = useMemo(() => getEmbedSrc(selected?.link ?? null), [selected?.link]);

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
            valueFormat={valueFormat}
            onClick={
              p.link
                ? () => {
                    setSelected(p);
                    setOpen(true);
                  }
                : undefined
            }
          />
        ))}
      </div>

      {open && selected ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setOpen(false);
              setSelected(null);
            }}
            aria-label="Close"
          />

          <div className="absolute left-1/2 top-1/2 w-[min(1100px,94vw)] -translate-x-1/2 -translate-y-1/2">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-zinc-900 dark:text-zinc-50">{selected.name}</div>
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {valueLabel ? valueLabel + ": " : ""}
                    {formatValue(selected.value, valueFormat)}
                    {selected.stateUF ? ` • ${selected.stateUF}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSelected(null);
                  }}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-black text-zinc-800 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-0 md:grid-cols-2">
                <div className="bg-black">
                  <div className="aspect-video w-full">
                    {selectedEmbed ? (
                      <iframe
                        src={selectedEmbed}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm font-semibold text-zinc-200">
                        Não foi possível embutir este link.
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Detalhes</div>
                  <div className="mt-3 max-h-[min(70vh,720px)] space-y-3 overflow-y-auto pr-1">
                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tempo</div>
                      <div className="mt-1 text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        {formatValue(selected.value, valueFormat)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Jogador</div>
                        <div className="mt-1 truncate text-sm font-black text-zinc-900 dark:text-zinc-50">{selected.name}</div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Data</div>
                        <div className="mt-1 truncate text-sm font-black text-zinc-900 dark:text-zinc-50">
                          {selected.achievedAt ? new Date(selected.achievedAt).toLocaleDateString("pt-BR") : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Link</div>
                      {selected.link ? (
                        <a
                          href={selected.link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-sm font-black text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {selected.link}
                        </a>
                      ) : (
                        <div className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-50">—</div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bastion</div>
                        <div className="mt-1 truncate text-sm font-black text-zinc-900 dark:text-zinc-50">
                          {selected.bastion ? selected.bastion : "—"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Seed</div>
                        <div className="mt-1 truncate text-sm font-black text-zinc-900 dark:text-zinc-50">
                          {selected.seed ? selected.seed : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Descrição</div>
                      {selected.description ? (
                        <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap break-words text-sm font-semibold leading-relaxed text-zinc-800 dark:text-zinc-100">
                          {selected.description}
                        </div>
                      ) : (
                        <div className="mt-1 text-sm font-black text-zinc-900 dark:text-zinc-50">—</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlayerCard({
  player,
  rank,
  uuidMap,
  valueLabel,
  valueFormat,
  onClick,
}: {
  player: PlayerRow;
  rank: number;
  uuidMap: UUIDMap;
  valueLabel: string;
  valueFormat?: ValueFormat;
  onClick?: (() => void) | undefined;
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
      className={
        "group relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition-all dark:border-zinc-800 dark:bg-zinc-900 " +
        (onClick ? "hover:shadow-lg hover:scale-[1.01]" : "")
      }
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
              {formatValue(player.value, valueFormat)}
            </div>
            <div className="text-xs uppercase tracking-wider text-zinc-500">{valueLabel}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function getEmbedSrc(link: string | null): string | null {
  const raw = String(link ?? "").trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    return id ? makeYouTubeEmbedUrl(id, url.searchParams.get("t")) : null;
  }

  if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
    const v = (url.searchParams.get("v") ?? "").trim();
    if (v) return makeYouTubeEmbedUrl(v, url.searchParams.get("t") ?? url.searchParams.get("start"));

    const parts = url.pathname.split("/").filter(Boolean);
    const embedIdx = parts.findIndex((p) => p === "embed");
    if (embedIdx >= 0 && parts[embedIdx + 1]) {
      return makeYouTubeEmbedUrl(parts[embedIdx + 1], url.searchParams.get("start"));
    }

    const shortsIdx = parts.findIndex((p) => p === "shorts");
    if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
      return makeYouTubeEmbedUrl(parts[shortsIdx + 1], url.searchParams.get("t") ?? url.searchParams.get("start"));
    }

    const liveIdx = parts.findIndex((p) => p === "live");
    if (liveIdx >= 0 && parts[liveIdx + 1]) {
      return makeYouTubeEmbedUrl(parts[liveIdx + 1], url.searchParams.get("t") ?? url.searchParams.get("start"));
    }

    return null;
  }

  return null;
}

function makeYouTubeEmbedUrl(idRaw: string, startRaw: string | null): string {
  void startRaw;
  const id = sanitizeYouTubeId(idRaw);
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
}

function sanitizeYouTubeId(raw: string): string {
  const s = String(raw ?? "").trim();
  const id = s.split("?")[0]?.split("&")[0]?.split("/")[0]?.trim() ?? "";
  return id;
}

function formatValue(value: number, fmt: ValueFormat | undefined) {
  if (fmt === "time_ms") return formatTimeMs(value);
  return Number(value ?? 0).toLocaleString("pt-BR");
}

function formatTimeMs(ms: number) {
  const v = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(v / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = v % 1000;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(millis).padStart(3, "0");
  return `${mm}:${ss}.${mmm}`;
}
