"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { TournamentBracket, BracketRound, BracketMatch } from "../lib/bracket";

function hasWinner(m: BracketMatch, side: 1 | 2) {
  return m.winner === side;
}

function normalizeSlotLabel(raw: string | undefined): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const lower = s.toLowerCase();
  if (lower === "tbd") return "";
  if (lower.startsWith("winner of ")) return "";
  if (lower.startsWith("loser of ")) return "";
  if (lower === "bye") return "";
  return s;
}

function ParticipantRow({
  name,
  score,
  winner,
}: {
  name: string;
  score: number | null;
  winner: boolean;
}) {
  const display = normalizeSlotLabel(name);
  const isEmpty = !display;

  return (
    <div
      className={
        "flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-xs font-semibold " +
        (isEmpty
          ? "border-zinc-200/70 bg-zinc-50/30 text-transparent dark:border-zinc-800/70 dark:bg-zinc-900/20"
          : winner
            ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
            : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100")
      }
    >
      <div className={"min-w-0 truncate " + (isEmpty ? "select-none" : "")}>{display || ""}</div>
      <div
        className={
          "shrink-0 tabular-nums " +
          (isEmpty ? "text-transparent" : "text-zinc-500 dark:text-zinc-400")
        }
      >
        {score == null ? "" : score}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const p1 = match.p1 ?? "";
  const p2 = match.p2 ?? "";
  const s1 = typeof match.s1 === "number" ? match.s1 : null;
  const s2 = typeof match.s2 === "number" ? match.s2 : null;

  return (
    <div className="space-y-1.5 rounded-lg border border-zinc-200 bg-white/70 p-2 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/30">
      <ParticipantRow name={p1} score={s1} winner={hasWinner(match, 1)} />
      <ParticipantRow name={p2} score={s2} winner={hasWinner(match, 2)} />
      {match.note ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{match.note}</div> : null}
    </div>
  );
}

function RoundColumn({ round, roundIndex }: { round: BracketRound; roundIndex: number }) {
  const baseGap = 10;
  const gapPx = Math.max(10, Math.round(baseGap * Math.pow(2, roundIndex)));
  const padTopPx = Math.round(gapPx / 2);

  return (
    <div className="w-[220px] shrink-0">
      <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {round.name}
      </div>
      <div className="flex flex-col" style={{ gap: `${gapPx}px`, paddingTop: `${padTopPx}px` }}>
        {round.matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, rounds }: { title: string; rounds: BracketRound[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [svgSize, setSvgSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const roundNames = useMemo(() => rounds.map((r) => r.name), [rounds]);

  function computePaths() {
    const el = containerRef.current;
    if (!el) return;

    const containerRect = el.getBoundingClientRect();
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-round][data-match]"));

    const w = Math.max(0, Math.ceil(el.scrollWidth));
    const h = Math.max(0, Math.ceil(el.scrollHeight));
    setSvgSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));

    const byRound = new Map<number, HTMLElement[]>();
    for (const n of nodes) {
      const r = Number(n.dataset.round ?? "-1");
      const m = Number(n.dataset.match ?? "-1");
      if (!Number.isFinite(r) || !Number.isFinite(m) || r < 0 || m < 0) continue;
      const arr = byRound.get(r) ?? [];
      arr[m] = n;
      byRound.set(r, arr);
    }

    const next: string[] = [];
    const roundsCount = rounds.length;
    for (let r = 0; r < roundsCount - 1; r++) {
      const fromMatches = byRound.get(r) ?? [];
      const toMatches = byRound.get(r + 1) ?? [];
      for (let i = 0; i < fromMatches.length; i++) {
        const from = fromMatches[i];
        if (!from) continue;
        const to = toMatches[Math.floor(i / 2)];
        if (!to) continue;

        const a = from.getBoundingClientRect();
        const b = to.getBoundingClientRect();

        const ax = a.right - containerRect.left + el.scrollLeft;
        const ay = a.top - containerRect.top + el.scrollTop + a.height / 2;
        const bx = b.left - containerRect.left + el.scrollLeft;
        const by = b.top - containerRect.top + el.scrollTop + b.height / 2;

        // Draw a classic bracket connector: horizontal out, vertical, horizontal in.
        const midX = ax + Math.max(18, Math.round((bx - ax) * 0.45));
        next.push(`M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${by} L ${bx} ${by}`);
      }
    }

    setPaths(next);
  }

  useLayoutEffect(() => {
    computePaths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNames.join("|")]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => computePaths());
    };

    const onScroll = () => schedule();
    const onResize = () => schedule();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => schedule());
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundNames.join("|")]);

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-200">{title}</div>
        <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{rounds.length} rounds</div>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-auto rounded-2xl border border-zinc-200 bg-white/50 px-3 py-3 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/30"
        style={{ height: "min(70vh, 560px)" }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0"
          aria-hidden="true"
          width={svgSize.w || 0}
          height={svgSize.h || 0}
          viewBox={`0 0 ${svgSize.w || 0} ${svgSize.h || 0}`}
        >
          <g fill="none" stroke="currentColor" className="text-zinc-300 dark:text-zinc-800" strokeWidth={2}>
            {paths.map((d, idx) => (
              <path key={idx} d={d} />
            ))}
          </g>
        </svg>

        <div className="relative flex h-full min-h-[360px] gap-5">
          {rounds.map((r, idx) => (
            <div key={`${r.name}-${idx}`} className="w-[220px] shrink-0">
              <div className="mb-2 text-[11px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {r.name}
              </div>
              {(() => {
                const base = Math.max(1, Math.pow(2, idx));
                const topBottom = Math.max(1, Math.round(base / 2));

                return (
                  <div className="flex h-[calc(100%-22px)] flex-col">
                    <div style={{ flexGrow: topBottom }} />
                    {r.matches.map((m, mIdx) => (
                      <div key={m.id} className="contents">
                        <div data-round={idx} data-match={mIdx} className="relative">
                          <MatchCard match={m} />
                        </div>
                        {mIdx < r.matches.length - 1 ? <div style={{ flexGrow: base }} /> : null}
                      </div>
                    ))}
                    <div style={{ flexGrow: topBottom }} />
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BracketView({ bracket }: { bracket: TournamentBracket }) {
  const winners = Array.isArray(bracket.winners) ? bracket.winners : [];
  const losers = Array.isArray(bracket.losers) ? bracket.losers : [];
  const finals = Array.isArray(bracket.finals) ? bracket.finals : [];

  if (winners.length === 0 && losers.length === 0 && finals.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200">
        Nenhum bracket salvo para este torneio.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {winners.length > 0 ? <Section title="Winners" rounds={winners} /> : null}
      {losers.length > 0 ? <Section title="Losers" rounds={losers} /> : null}
      {finals.length > 0 ? <Section title="Finals" rounds={finals} /> : null}
    </div>
  );
}
