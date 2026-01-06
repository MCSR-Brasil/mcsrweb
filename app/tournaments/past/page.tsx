import Link from "next/link";
import { PageHeader } from "../../../components/page-header";
import { getPastTournaments } from "../../../lib/repositories/tournaments";

export default async function PastTournamentsPage() {
  const rows = await getPastTournaments(50);

  return (
    <div>
      <PageHeader
        title="Torneios Passados"
        subtitle="Histórico (mock/Turso). Quando Turso estiver ligado, isso vira uma lista real com links, vencedores e stats."
        right={
          <Link
            href="/tournaments"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Voltar
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3">
        {rows.map((t) => (
          <Link
            key={t.id}
            href={`/tournaments/${encodeURIComponent(t.id)}`}
            className="block rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 hover:underline">{t.name}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Prizepool: <span className="font-semibold">{t.prizepool ?? "—"}</span>
            </div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Finalizado em:{" "}
              <span className="font-semibold">{t.endsAt ? new Date(t.endsAt).toLocaleDateString("pt-BR") : "—"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
