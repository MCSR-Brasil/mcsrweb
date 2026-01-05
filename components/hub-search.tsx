"use client";

import { useState } from "react";

export function HubSearch() {
  const [q, setQ] = useState("");

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/70 p-5 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar player, leaderboard, torneios..."
        className="font-minecraft w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 focus:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </div>
  );
}
