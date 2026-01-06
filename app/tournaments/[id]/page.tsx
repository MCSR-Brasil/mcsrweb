import Link from "next/link";
import { PageHeader } from "../../../components/page-header";
import { BracketView } from "../../../components/bracket-view";
import { safeParseBracketJson, generateSingleElimBracketFromParticipants, generateDoubleElimBracketFromParticipants } from "../../../lib/bracket";
import { getTournamentById } from "../../../lib/repositories/tournaments";

export default async function TournamentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const t = await getTournamentById(id);

  if (!t) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Torneio"
          subtitle="Não encontrado"
          right={
            <Link
              href="/tournaments"
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Voltar
            </Link>
          }
        />
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200">
          Torneio não encontrado.
        </div>
      </div>
    );
  }

  const bracketFromDb = safeParseBracketJson(t.bracketJson);
  const bracketGenerated =
    !bracketFromDb && t.type === "bracket" && t.participantsCsv
      ? t.bracketFormat === "double_elim"
        ? generateDoubleElimBracketFromParticipants(t.participantsCsv, {
            tournamentId: t.id,
            losersBracketStartsRound: t.losersBracketStartsRound ?? 1,
          })
        : generateSingleElimBracketFromParticipants(t.participantsCsv, t.id)
      : null;

  const bracket = bracketFromDb ?? bracketGenerated;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.name}
        subtitle={
          t.type === "bracket"
            ? "Torneio de bracket"
            : t.type === "btrl"
              ? "Torneio BTRL"
              : "Evento"
        }
        right={
          <Link
            href="/tournaments"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Voltar
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Início</div>
          <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {new Date(t.startsAt).toLocaleDateString("pt-BR")}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Fim</div>
          <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t.endsAt ? new Date(t.endsAt).toLocaleDateString("pt-BR") : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Prizepool</div>
          <div className="mt-1 text-sm font-bold text-zinc-900 dark:text-zinc-50">{t.prizepool ?? "—"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Participantes</div>
          <div className="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200 break-words">
            {t.participantsCsv?.trim() ? t.participantsCsv : "—"}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Winner</div>
          <div className="mt-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">{t.winner ?? "—"}</div>
        </div>
      </div>

      {bracket ? (
        <BracketView bracket={bracket} />
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white/70 p-6 text-sm font-semibold text-zinc-700 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-200">
          Nenhum bracket para exibir.
        </div>
      )}
    </div>
  );
}
