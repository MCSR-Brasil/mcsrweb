import Link from "next/link";
import { PageHeader } from "../../components/page-header";
import { BracketView } from "../../components/bracket-view";
import {
  generateDoubleElimBracketFromParticipants,
  generateSingleElimBracketFromParticipants,
  safeParseBracketJson,
} from "../../lib/bracket";
import { getTournamentSnapshot } from "../../lib/repositories/tournaments";

export default async function TournamentsPage() {
  const { current } = await getTournamentSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Torneios"
        subtitle="Página principal mostra o torneio atual. Se não houver, mostra o histórico."
        right={
          <Link
            href="/tournaments/past"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Ver passados
          </Link>
        }
      />

      {current ? (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Em andamento
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            <Link href={`/tournaments/${encodeURIComponent(current.id)}`} className="hover:underline">
              {current.name}
            </Link>
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Prizepool: <span className="font-semibold">{current.prizepool ?? "—"}</span>
          </div>
          {current.endsAt ? (
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Termina em: <span className="font-semibold">{new Date(current.endsAt).toLocaleDateString("pt-BR")}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            Nenhum torneio rolando agora.
          </div>
          <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Veja o histórico em <Link className="font-semibold text-emerald-600" href="/tournaments/past">/tournaments/past</Link>.
          </div>
        </div>
      )}

      {current && current.type === "bracket" ? (() => {
        const bracketFromDb = safeParseBracketJson(current.bracketJson);
        const bracketGenerated =
          !bracketFromDb && current.participantsCsv
            ? current.bracketFormat === "double_elim"
              ? generateDoubleElimBracketFromParticipants(current.participantsCsv, {
                  tournamentId: current.id,
                  losersBracketStartsRound: current.losersBracketStartsRound ?? 1,
                })
              : generateSingleElimBracketFromParticipants(current.participantsCsv, current.id)
            : null;

        const bracket = bracketFromDb ?? bracketGenerated;
        return bracket ? <BracketView bracket={bracket} /> : null;
      })() : null}
    </div>
  );
}
