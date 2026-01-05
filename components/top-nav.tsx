import Link from "next/link";

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
            <div className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Minecraft Speedrunning Brasil
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
