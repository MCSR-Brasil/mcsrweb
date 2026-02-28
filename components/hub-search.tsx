"use client";

export function HubSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {

  return (
    <div className="rounded-2xl border border-zinc-300 bg-white/95 p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-950/85">
      <label htmlFor="hub-search" className="mb-2 block text-xs font-black uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
        Buscar seção
      </label>
      <input
        id="hub-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: estados, earnings, rsg..."
        className="font-minecraft w-full rounded-xl border border-zinc-300 bg-white px-5 py-4 text-sm font-black text-zinc-900 shadow-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
    </div>
  );
}
