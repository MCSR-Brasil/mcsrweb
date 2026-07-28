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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-full border border-border bg-card px-3 py-2 text-[11px] font-black uppercase tracking-wider text-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="Voltar para a página anterior"
          >
            Voltar
          </button>
          <Link
            href="/"
            className="font-minecraft block truncate text-xl font-black tracking-tight text-foreground"
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
                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                : "border-border bg-card text-foreground hover:border-primary hover:text-primary");
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
