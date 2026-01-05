import Link from "next/link";
import { HubSearch } from "../components/hub-search";

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
      <div className="py-6 text-center">
        <h1 className="font-minecraft text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
          MCSR BR
        </h1>
        <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Minecraft Speedrunning Brasil
        </div>
      </div>

      <HubSearch />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-zinc-200 bg-white/70 p-6 shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-md active:translate-y-0 dark:border-zinc-800 dark:bg-zinc-950/50"
          >
            <div className="font-minecraft text-lg font-black text-zinc-950 dark:text-zinc-50">{s.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
