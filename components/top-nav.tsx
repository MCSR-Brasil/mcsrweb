"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Início" },
  { href: "/tournaments", label: "Torneios" },
  { href: "/leaderboards/earnings", label: "Ganhos" },
  { href: "/leaderboards/mc", label: "Leaderboards" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-wider text-zinc-700 transition-colors hover:border-emerald-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500 dark:hover:text-zinc-50"
            aria-label="Voltar para a página anterior"
          >
            Voltar
          </button>
          <Link
            href="/"
            className="font-minecraft block truncate bg-gradient-to-r from-emerald-600 via-zinc-900 to-emerald-700 bg-clip-text text-xl font-black tracking-tight text-transparent dark:via-zinc-100"
          >
            MCSR BR
          </Link>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            const cls =
              "rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all " +
              (active
                ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                : "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-300 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-emerald-500 dark:hover:text-zinc-50");
            return (
              <Link key={item.href} href={item.href} className={cls}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
