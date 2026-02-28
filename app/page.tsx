"use client";

import Link from "next/link";

const sections = [
  {
    href: "/tournaments",
    title: "Torneios",
    desc: "Índice de campeonatos e páginas de torneio.",
  },
  {
    href: "/leaderboards/mc",
    title: "Leaderboards",
    desc: "RSG + Ranked + Estados em uma página só.",
  },
  {
    href: "/leaderboards/earnings",
    title: "Ganhos de Torneios",
    desc: "Prizepools e vencedores.",
  },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-zinc-50 to-emerald-50 px-6 py-10 shadow-sm dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative text-center">
          <h1 className="font-minecraft text-4xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            MCSR BR
          </h1>
          <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
            Minecraft Speedrunning Brasil
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-3xl border border-zinc-300 bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Leaderboard</div>
            <div className="mt-3 font-minecraft text-xl font-black text-zinc-950 dark:text-zinc-50">{s.title}</div>
            <p className="mt-3 max-w-[34ch] text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300">{s.desc}</p>
            <div className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">Abrir →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
