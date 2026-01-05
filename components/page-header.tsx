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
    <header className="mb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-minecraft mb-2 bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="max-w-3xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  );
}
