"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/leaderboards/states", label: "Estados" },
  { href: "/leaderboards/earnings", label: "Ganhos" },
  { href: "/leaderboards/rsg", label: "RSG" },
  { href: "/leaderboards/ranked", label: "Ranked" },
  { href: "/tournaments", label: "Torneios" },
  { href: "/more", label: "Mais" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <Link
              href="/"
              className="font-minecraft block truncate bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-xl font-black tracking-tight text-transparent dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50"
            >
              MCSR BR
            </Link>
          </div>

          <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200 bg-white/70 p-1 dark:border-zinc-800 dark:bg-zinc-900/60">
            {navItems.map((item) => (
              (() => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const cls =
                  "font-minecraft rounded-lg px-3 py-2 text-xs font-black uppercase tracking-wider transition-all " +
                  (active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-zinc-700 hover:bg-white/80 dark:text-zinc-200 dark:hover:bg-zinc-800");
                return (
              <Link
                key={item.href}
                href={item.href}
                className={cls}
              >
                {item.label}
              </Link>
                );
              })()
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
