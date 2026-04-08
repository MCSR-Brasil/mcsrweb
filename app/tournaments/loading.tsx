export default function TournamentsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="text-center">
        <div className="mx-auto h-9 w-44 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <div className="space-y-4">
        <div className="h-40 rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
        <div className="h-40 rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
        <div className="h-40 rounded-3xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
      </div>
    </div>
  );
}
