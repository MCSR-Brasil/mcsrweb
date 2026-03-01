"use client";

import { useMemo, useState } from "react";
import type { TournamentPageData, TournamentSsgBoard, TournamentSsgResult, TournamentSsgScoreRow } from "../lib/repositories/tournaments";

type TournamentPageRendererProps = {
  data: TournamentPageData;
};

const EMPTY_BOARDS: TournamentSsgBoard[] = [];
const EMPTY_SCOREBOARD: TournamentSsgScoreRow[] = [];

export function TournamentPageRenderer({ data }: TournamentPageRendererProps) {
  if (data.pageType === "ssg") return <SsgTournamentLayout data={data} />;
  if (data.pageType === "event") return <EventTournamentLayout data={data} />;
  if (data.pageType === "custom") return <CustomTournamentLayout data={data} />;
  return <RankingTournamentLayout data={data} />;
}

function SsgTournamentLayout({ data }: { data: TournamentPageData }) {
  const pageTitle = data.content.title ?? data.cardTitle;
  const pageDescription = data.content.description ?? data.cardDescription;
  const boards = data.content.boards ?? EMPTY_BOARDS;
  const scoreboard = data.content.ssgScoreboard ?? EMPTY_SCOREBOARD;
  const seeds = data.content.seeds ?? [];
  const hasLinks = data.content.links.length > 0;
  const hasUtilityChips = hasLinks || seeds.length > 0;
  const [selectedTabKey, setSelectedTabKey] = useState<string>("ssg-placar");
  const [copiedSeedIndex, setCopiedSeedIndex] = useState<number | null>(null);

  const tabs = useMemo(
    () => [
      { key: "ssg-placar", label: "Placar", board: null as TournamentSsgBoard | null },
      ...boards.map((board) => ({ key: board.key, label: board.label, board })),
    ],
    [boards]
  );

  const selectedTab = useMemo(
    () => tabs.find((tab) => tab.key === selectedTabKey) ?? tabs[0] ?? { key: "ssg-placar", label: "Placar", board: null },
    [tabs, selectedTabKey]
  );
  const selectedBoard = selectedTab.board;

  async function handleCopySeed(seed: string, index: number) {
    try {
      await navigator.clipboard.writeText(seed);
      setCopiedSeedIndex(index);
      window.setTimeout(() => setCopiedSeedIndex((current) => (current === index ? null : current)), 1800);
    } catch {
      setCopiedSeedIndex(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="mt-3 font-minecraft text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">{pageTitle}</h1>
          <TournamentMetaChips prizePool={data.prizePool} startsAt={data.startsAt} className="mt-4" />
        </div>
      </section>

      <div className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-lg">{renderMarkdown(pageDescription)}</div>

      {hasUtilityChips ? (
        <section className="space-y-4">
          {hasLinks ? (
            <div className="flex flex-wrap items-center gap-2">
              {data.content.links.map((link, idx) => (
                <a
                  key={`${link.href}-${idx}`}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-emerald-300/60 bg-emerald-100/70 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] text-emerald-800 transition-all hover:border-emerald-500 hover:bg-emerald-500/15 hover:text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/20"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          {seeds.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400" aria-live="polite">
                {copiedSeedIndex !== null ? `Seed ${copiedSeedIndex + 1} copiada` : "Clique em uma seed para copiar"}
              </div>

              <div className="flex flex-wrap gap-2">
                {seeds.map((seed, idx) => {
                  const copied = copiedSeedIndex === idx;
                  return (
                    <button
                      key={`seed-${idx}`}
                      type="button"
                      onClick={() => handleCopySeed(seed, idx)}
                      className={
                        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900 " +
                        (copied
                          ? "border-emerald-500 bg-emerald-600 text-white"
                          : "border-emerald-300/70 bg-emerald-50 text-emerald-800 hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:border-emerald-400 dark:hover:bg-emerald-500/20")
                      }
                      aria-label={`Copiar seed ${idx + 1}`}
                    >
                      Seed {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        {tabs.length > 0 ? (
          <div className="flex justify-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-zinc-200/80 bg-white/90 p-3 shadow-lg backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/85 sm:p-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedTabKey(tab.key)}
                  className={
                    "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all " +
                    (tab.key === selectedTab.key
                      ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                      : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                  }
                  aria-pressed={tab.key === selectedTab.key}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h2 className="text-center text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            {selectedTab.label}
          </h2>
        </div>

        {selectedTab.key === "ssg-placar" ? (
          <div className="space-y-3">
            {scoreboard.length ? (
              scoreboard.map((row, idx) => <SsgScoreboardCard key={`${row.name}-${idx}`} place={idx + 1} row={row} />)
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                Sem pontuação disponível ainda.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {selectedBoard?.results.length ? (
              selectedBoard.results.map((result, idx) => (
                <SsgResultCard
                  key={`${selectedBoard.key}-${result.name ?? "runner"}-${idx}`}
                  place={idx + 1}
                  result={result}
                />
              ))
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                Sem resultados para esta seed.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function SsgScoreboardCard({ place, row }: { place: number; row: TournamentSsgScoreRow }) {
  const placementStyle = getPlacementStyle(place);
  const skinUrl = skinBustUrlByName(row.name);

  return (
    <article className={`relative overflow-hidden rounded-2xl border p-4 ${placementStyle.cardClass}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${placementStyle.barClass}`} />
      <div className={`text-xs font-black uppercase tracking-[0.14em] ${placementStyle.rankClass}`}>#{place}</div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {skinUrl ? (
            <img
              src={skinUrl}
              alt={`${row.name || "Player"} skin`}
              className="h-12 w-12 rounded-lg border border-zinc-300 bg-zinc-100 object-cover dark:border-zinc-700 dark:bg-zinc-900"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className={`truncate text-lg font-extrabold ${placementStyle.nameClass}`}>{row.name || "TBD"}</div>
        </div>
        <div className={`shrink-0 text-base font-black ${placementStyle.prizeClass}`}>{row.points} pts</div>
      </div>
    </article>
  );
}

function SsgResultCard({
  place,
  result,
}: {
  place: number;
  result: TournamentSsgResult;
}) {
  const placementStyle = getPlacementStyle(place);
  const isNotVerified = result.verified === false;
  const skinUrl = skinBustUrlByName(result.name);

  return (
    <article className={`relative overflow-hidden rounded-2xl border p-4 ${placementStyle.cardClass}`}>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${placementStyle.barClass}`} />
      <div className={`text-xs font-black uppercase tracking-[0.14em] ${placementStyle.rankClass}`}>#{place}</div>

      {isNotVerified ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span
            title="não foi verificada"
            className="pointer-events-auto inline-flex h-6 w-6 items-center justify-center text-xs font-black text-amber-700 shadow-sm dark:text-amber-300"
          >
            ⚠
          </span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {skinUrl ? (
            <img
              src={skinUrl}
              alt={`${result.name ?? "Player"} skin`}
              className="h-12 w-12 rounded-lg border border-zinc-300 bg-zinc-100 object-cover dark:border-zinc-700 dark:bg-zinc-900"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className={`truncate text-lg font-extrabold ${placementStyle.nameClass}`}>{result.name ?? "TBD"}</div>
        </div>

        <div className={`shrink-0 text-xl font-semibold ${placementStyle.prizeClass}`}>{result.time ?? "—"}</div>
      </div>
    </article>
  );
}

function getPlacementStyle(place: number) {
  if (place === 1) {
    return {
      cardClass: "border-yellow-300 bg-gradient-to-br from-yellow-50 via-amber-50 to-zinc-50 dark:border-yellow-500/40 dark:from-yellow-500/10 dark:via-amber-500/10 dark:to-zinc-950/70",
      barClass: "from-yellow-300 via-amber-400 to-yellow-500",
      rankClass: "text-yellow-700 dark:text-yellow-300",
      nameClass: "text-zinc-900 dark:text-yellow-100",
      prizeClass: "text-yellow-700 dark:text-yellow-300",
    };
  }

  if (place === 2) {
    return {
      cardClass: "border-zinc-300 bg-gradient-to-br from-zinc-100 via-zinc-50 to-white dark:border-zinc-500/40 dark:from-zinc-400/10 dark:via-zinc-500/10 dark:to-zinc-950/70",
      barClass: "from-zinc-300 via-zinc-400 to-zinc-500",
      rankClass: "text-zinc-600 dark:text-zinc-300",
      nameClass: "text-zinc-900 dark:text-zinc-100",
      prizeClass: "text-zinc-700 dark:text-zinc-300",
    };
  }

  if (place === 3) {
    return {
      cardClass: "border-amber-400/70 bg-gradient-to-br from-amber-100 via-amber-50 to-zinc-50 dark:border-amber-700/50 dark:from-amber-700/15 dark:via-amber-800/10 dark:to-zinc-950/70",
      barClass: "from-amber-500 via-amber-600 to-orange-700",
      rankClass: "text-amber-700 dark:text-amber-300",
      nameClass: "text-zinc-900 dark:text-amber-100",
      prizeClass: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    cardClass: "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70",
    barClass: "from-emerald-400 to-cyan-500",
    rankClass: "text-zinc-500 dark:text-zinc-400",
    nameClass: "text-zinc-900 dark:text-zinc-50",
    prizeClass: "text-emerald-700 dark:text-emerald-400",
  };
}

function RankingTournamentLayout({ data }: { data: TournamentPageData }) {
  const hasResults = data.content.results.length > 0;
  const hasLinks = data.content.links.length > 0;

  const pageTitle = data.content.title ?? data.cardTitle;
  const pageDescription = data.content.description ?? data.cardDescription;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <h1 className="mt-3 font-minecraft text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">{pageTitle}</h1>
          <TournamentMetaChips prizePool={data.prizePool} startsAt={data.startsAt} className="mt-4" />
        </div>
      </section>

      <div className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-lg">{renderMarkdown(pageDescription)}</div>

      {hasLinks ? (
        <section className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Links</div>
          <div className="flex flex-wrap gap-2">
            {data.content.links.map((link, idx) => (
              <a
                key={`${link.href}-${idx}`}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
              >
                {link.label}
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        <div className="mb-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Podium</div>

        {!hasResults ? (
          <div className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Sem resultados cadastrados ainda.</div>
        ) : (
          <div className="space-y-3">
            {data.content.results.map((r, idx) => {
              const place = idx + 1;
              const skinUrl = skinBustUrl(r.uuid);
              const placementStyle = getPlacementStyle(place);
              return (
                <article
                  key={`${r.name ?? "player"}-${idx}`}
                  className={`relative overflow-hidden rounded-2xl border p-4 ${placementStyle.cardClass}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${placementStyle.barClass}`} />
                  <div className={`text-xs font-black uppercase tracking-[0.14em] ${placementStyle.rankClass}`}>#{place}</div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {skinUrl ? (
                        <img
                          src={skinUrl}
                          alt={`${r.name ?? "Player"} skin`}
                          className="h-14 w-14 rounded-lg border border-zinc-300 bg-zinc-100 object-cover dark:border-zinc-700 dark:bg-zinc-900"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : null}
                      <div className={`min-w-0 truncate text-lg font-extrabold ${placementStyle.nameClass}`}>{r.name ?? "TBD"}</div>
                    </div>
                    <div className={`shrink-0 text-sm font-semibold ${placementStyle.prizeClass}`}>{r.prize ?? "—"}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EventTournamentLayout({ data }: { data: TournamentPageData }) {
  return <RankingTournamentLayout data={data} />;
}

function CustomTournamentLayout({ data }: { data: TournamentPageData }) {
  return <RankingTournamentLayout data={data} />;
}

function skinBustUrl(uuid: string | null): string | null {
  const rawUuid = String(uuid ?? "").trim();
  if (!rawUuid) return null;
  return `https://skins.mcstats.com/bust/${rawUuid}`;
}

function skinBustUrlByName(name: string | null): string | null {
  const rawName = String(name ?? "").trim();
  if (!rawName) return null;
  return `https://mc-heads.net/avatar/${encodeURIComponent(rawName)}/100`;
}

function TournamentMetaChips({
  prizePool,
  startsAt,
  className,
}: {
  prizePool?: string;
  startsAt?: string;
  className?: string;
}) {
  if (!prizePool && !startsAt) return null;
  return (
    <div className={"flex flex-wrap gap-2 " + (className ?? "") }>
      {prizePool ? (
        <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
          Prize Pool: {prizePool}
        </span>
      ) : null}
      {startsAt ? (
        <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-sky-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300">
          Início: {formatDateLabel(startsAt)}
        </span>
      ) : null}
    </div>
  );
}

function formatDateLabel(raw: string): string {
  const text = String(raw ?? "").trim();
  if (!text) return "—";
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function renderMarkdown(source: string) {
  const blocks = source.split(/\r?\n\s*\r?\n/).filter((block) => block.trim().length > 0);
  return (
    <>
      {blocks.map((block, idx) => (
        <p key={`md-p-${idx}`} className="mb-4 last:mb-0">
          {renderInlineMarkdown(block)}
        </p>
      ))}
    </>
  );
}

function renderInlineMarkdown(text: string) {
  const normalized = text.replace(/\r?\n/g, "\n");
  const pieces = normalized.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);

  return pieces.map((piece, idx) => {
    const strongMatch = piece.match(/^\*\*([^*]+)\*\*$/);
    if (strongMatch) {
      return (
        <strong key={`md-strong-${idx}`} className="font-black text-amber-500 dark:text-amber-400">
          {strongMatch[1]}
        </strong>
      );
    }

    const withBreaks = piece.split("\n");
    return (
      <span key={`md-text-${idx}`}>
        {withBreaks.map((line, lineIdx) => (
          <span key={`md-line-${idx}-${lineIdx}`}>
            {line}
            {lineIdx < withBreaks.length - 1 ? <br /> : null}
          </span>
        ))}
      </span>
    );
  });
}
