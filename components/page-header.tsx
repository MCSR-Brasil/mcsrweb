import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white/85 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 sm:p-8">
      <div className="pointer-events-none absolute" />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            Leaderboard
          </div>
          <h1 className="font-minecraft mb-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-sm font-semibold leading-relaxed text-zinc-700 dark:text-zinc-300 sm:text-base">
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
