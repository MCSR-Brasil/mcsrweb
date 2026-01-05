export function StateBadge({ uf }: { uf: string }) {
  const label = uf.trim().toUpperCase();
  return (
    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold tracking-wide text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {label}
    </span>
  );
}
