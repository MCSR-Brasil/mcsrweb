import Link from "next/link";
import { getTournamentCards } from "../../lib/repositories/tournaments";

export const revalidate = 500;

export default async function TournamentsIndexPage() {
  const tournaments = await getTournamentCards();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-minecraft text-3xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
          Torneios
        </h1>
      </div>

      <div className="space-y-4">
        {tournaments.map((t) => (
          <Link
            key={t.slug}
            href={`/tournaments/${t.slug}`}
            prefetch
            className="group relative block overflow-hidden rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
                  Tournament
                </div>
                <div className="mt-2 font-minecraft text-2xl font-black leading-tight text-zinc-950 dark:text-zinc-50 sm:text-3xl">
                  {t.title}
                </div>
                <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                  {t.subtitle}
                </div>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
                  {t.description}
                </p>

                {(t.prizePool || t.startsAt) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.prizePool ? (
                      <span className="inline-flex items-center rounded-full border border-amber-300/70 bg-amber-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
                        Prize Pool: {t.prizePool}
                      </span>
                    ) : null}
                    {t.startsAt ? (
                      <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-sky-100/70 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300">
                        Início: {formatDateLabel(t.startsAt)}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-700 transition-colors group-hover:bg-emerald-500/20 dark:text-emerald-300">
                Abrir →
              </div>
            </div>
          </Link>
        ))}
      </div>
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
