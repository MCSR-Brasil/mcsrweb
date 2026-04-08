export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
        <div className="h-10 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-4 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
      </section>

      <section className="rounded-2xl border border-zinc-300 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 sm:p-6">
        <div className="mb-4 h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3">
          <div className="h-16 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
          <div className="h-16 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
          <div className="h-16 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950/70" />
        </div>
      </section>
    </div>
  );
}
