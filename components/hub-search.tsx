"use client";

import { useMemo, useState } from "react";

const quickActions = [
  { href: "/leaderboards/earnings", label: "Ganhos" },
  { href: "/leaderboards/rsg", label: "RSG" },
  { href: "/leaderboards/ranked", label: "Ranked" },
  { href: "/leaderboards/states", label: "Estados" },
  { href: "/tournaments", label: "Torneios" },
  { href: "/more", label: "Mais" },
];

export function HubSearch() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return quickActions;
    return quickActions.filter((a) => a.label.toLowerCase().includes(s));
  }, [q]);

  const nameMcUrl = useMemo(() => {
    const s = q.trim();
    if (!s) return "https://namemc.com";
    return `https://namemc.com/search?q=${encodeURIComponent(s)}`;
  }, [q]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar (player, leaderboard, torneios...)"
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <a
          href={nameMcUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
        >
          Buscar no NameMC
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filtered.map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {a.label}
          </a>
        ))}
      </div>
    </div>
  );
}
