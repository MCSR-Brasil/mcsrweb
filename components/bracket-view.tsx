"use client";

import type { TournamentBracket, BracketRound, BracketMatch } from "../lib/bracket";

function hasWinner(m: BracketMatch, side: 1 | 2) {
  return m.winner === side;
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
  return (
    <div
      className={
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm font-semibold " +
        (winner
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
          : "border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100")
      }
    >
      <div className="min-w-0 truncate">{name}</div>
      <div className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">{score == null ? "" : score}</div>
    </div>
  );
}

function MatchCard({ match }: { match: BracketMatch }) {
  const p1 = match.p1 ?? "TBD";
  const p2 = match.p2 ?? "TBD";
  const s1 = typeof match.s1 === "number" ? match.s1 : null;
  const s2 = typeof match.s2 === "number" ? match.s2 : null;

  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 bg-white/70 p-3 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/40">
      <ParticipantRow name={p1} score={s1} winner={hasWinner(match, 1)} />
      <ParticipantRow name={p2} score={s2} winner={hasWinner(match, 2)} />
      {match.note ? <div className="text-xs text-zinc-500 dark:text-zinc-400">{match.note}</div> : null}
    </div>
  );
}

function RoundColumn({ round }: { round: BracketRound }) {
  return (
    <div className="w-[260px] shrink-0">
      <div className="mb-2 text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {round.name}
      </div>
      <div className="space-y-3">
        {round.matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}

function Section({ title, rounds }: { title: string; rounds: BracketRound[] }) {
  return (
    <section className="space-y-3">
      <div className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">{title}</div>
      <div className="overflow-auto rounded-2xl border border-zinc-200 bg-white/50 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/30">
        <div className="flex gap-4">
          {rounds.map((r) => (
            <RoundColumn key={r.name} round={r} />
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
    <div className="space-y-6">
      {winners.length > 0 ? <Section title="Winners Bracket" rounds={winners} /> : null}
      {losers.length > 0 ? <Section title="Losers Bracket" rounds={losers} /> : null}
      {finals.length > 0 ? <Section title="Finals" rounds={finals} /> : null}
    </div>
  );
}
