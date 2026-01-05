import Link from "next/link";
import { HubSearch } from "../components/hub-search";
import { PageHeader } from "../components/page-header";

const sections = [
  {
    href: "/leaderboards/states",
    title: "Leaderboard por Estado",
    desc: "Mapa do Brasil + ranking de estados.",
  },
  {
    href: "/leaderboards/earnings",
    title: "Ganhos de Torneios",
    desc: "Prizepools e vencedores.",
  },
  {
    href: "/leaderboards/rsg",
    title: "RSG Leaderboard",
    desc: "Ranking geral do RSG.",
  },
  {
    href: "/leaderboards/ranked",
    title: "Ranked Leaderboard",
    desc: "MMR / Elo.",
  },
  {
    href: "/tournaments",
    title: "Torneios",
    desc: "Torneio atual + histórico.",
  },
  {
    href: "/more",
    title: "Mais",
    desc: "Links, guias e informações.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="MCSR BR"
        subtitle="Hub da comunidade: leaderboards, torneios e stats. Use a busca ou entre direto em uma seção."
      />

      <HubSearch />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50">{s.title}</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.desc}</div>
            <div className="mt-3 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700 dark:text-emerald-400">
              Abrir
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
