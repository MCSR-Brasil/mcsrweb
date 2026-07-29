"use client";

import { useEffect, useMemo, useState } from "react";

import { normalizeName } from "../lib/normalize";
import type { UUIDMap } from "../lib/uuids";
import { StateFlag } from "./state-flag";

export type PlayerRow = {
  name: string;
  value: number;
  stateUF?: string | null;
  uuid?: string | null;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

type ValueFormat = "number" | "time_ms" | "string";

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
  const [selectedRank, setSelectedRank] = useState(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setSelected(null);
        setSelectedRank(0);
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
                    setSelectedRank(i + 1);
                    setOpen(true);
                  }
                : undefined
            }
          />
        ))}
      </div>

      {open && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setSelected(null);
              setSelectedRank(0);
            }}
            aria-label="Fechar"
          />

          <div
            className="relative z-10 flex w-full max-w-7xl max-h-[92dvh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center gap-4 border-b border-border px-6 py-5">
              <div
                className={[
                  "bg-gradient-to-br flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-black tabular-nums text-white shadow-sm",
                  rankColor(selectedRank - 1),
                ].join(" ")}
                style={{ WebkitTextStroke: "1px black" }}
              >
                #{selectedRank}
              </div>
              <img
                src={getPlayerBustUrl(selected, uuidMap)}
                alt={`${selected.name} head`}
                className="h-14 w-14 rounded-lg border border-border bg-secondary object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-minecraft truncate text-2xl font-normal leading-tight text-card-foreground md:text-3xl">
                  {selected.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                  setSelectedRank(0);
                }}
                className="rounded-lg border border-border bg-card p-2 text-lg font-black text-muted-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
              <div className="flex aspect-video w-full items-center justify-center bg-black">
                {selectedEmbed ? (
                  <iframe
                    src={selectedEmbed}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-center text-sm font-semibold text-zinc-300">
                    <span>Não foi possível embutir este link.</span>
                    {selected.link ? (
                      <a
                        href={selected.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        Abrir link original
                      </a>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="space-y-4 overflow-y-auto p-5">
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tempo</div>
                  <div className="font-minecraft text-4xl font-black tracking-tight text-primary">
                    {formatValue(selected.value, valueFormat)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Detail label="Jogador" value={selected.name} />
                  <Detail
                    label="Estado"
                    value={
                      selected.stateUF ? (
                        <StateFlag uf={selected.stateUF} className="h-5 w-7 rounded" />
                      ) : (
                        "—"
                      )
                    }
                  />
                  <Detail label="Data" value={formatDisplayDate(selected.achievedAt)} />
                  <Detail label="Categoria" value={valueLabel || "RSG 1.16"} />
                  <Detail label="Bastion" value={selected.bastion || "—"} />
                  <Detail
                    label="Seed"
                    value={selected.seed ? <CopySeed seed={selected.seed} /> : "—"}
                  />
                </div>

                {selected.description ? (
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-muted-foreground">Descrição</div>
                    <div className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-card p-3 text-sm font-semibold leading-relaxed text-card-foreground">
                      {selected.description}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {selected.link ? (
                    <a
                      href={selected.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-black text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      Assistir run
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" x2="21" y1="14" y2="3" />
                      </svg>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setSelected(null);
                      setSelectedRank(0);
                    }}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-black text-card-foreground shadow-sm transition-colors hover:bg-secondary"
                  >
                    Fechar
                  </button>
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
  const bustUrl = getPlayerBustUrl(player, uuidMap);

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "group relative w-full overflow-hidden rounded-xl border border-zinc-300 bg-white text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 " +
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
          <div className="pointer-events-none absolute inset-y-0 left-2 flex items-start pt-1" aria-hidden="true">
            <div
              className="text-4xl leading-none text-white sm:text-5xl md:text-6xl"
              style={{
                fontFamily: "var(--font-display)",
                WebkitTextStroke: "1px black",
              }}
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

      {(player.link || player.achievedAt) && (
        <div className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {player.achievedAt ? `Data: ${formatDisplayDate(player.achievedAt)}` : "Clique para ver detalhes"}
        </div>
      )}
    </button>
  );
}

function formatDisplayDate(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text) return "—";

  const pt = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (pt) {
    const dd = String(Math.max(1, Math.min(31, Number(pt[1])))).padStart(2, "0");
    const mm = String(Math.max(1, Math.min(12, Number(pt[2])))).padStart(2, "0");
    const yy = pt[3].slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(parsed);
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
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

function getPlayerBustUrl(player: PlayerRow, uuidMap: UUIDMap): string {
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
  const direct = String(player.uuid ?? "").trim().toLowerCase().replace(/[^a-f0-9]/g, "");
  const finalUUID = direct || mapped || placeholderUUIDs[idx];
  return `https://skins.mcstats.com/bust/${finalUUID}`;
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-black text-card-foreground">{value}</div>
    </div>
  );
}

function CopySeed({ seed }: { seed: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(seed);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className="inline-flex items-center gap-1 text-sm font-black text-primary hover:underline"
      title="Copiar seed"
    >
      {seed}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      {copied ? <span className="text-xs text-muted-foreground">copiado</span> : null}
    </button>
  );
}
