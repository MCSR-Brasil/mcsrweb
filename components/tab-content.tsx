"use client";

import { RankingsView } from "./rankings-view";
import { Tabs } from "./tabs";
import type { UUIDMap } from "../lib/uuids";

type Leader = { name: string; earnings: number };
type Winner = { name: string; amount: number };
type EventRow = {
  event: string;
  prizepool: number | null;
  date: string | null;
  info: string | null;
  winners: Winner[];
};

export function TabContent({
  leaders,
  uuidMap,
  events,
  totalFormatted,
}: {
  leaders: Leader[];
  uuidMap: UUIDMap;
  events: EventRow[];
  totalFormatted: string;
}) {
  return (
    <>
      <Tabs tabs={[{ id: "rankings", label: "Rankings" }, { id: "events", label: "Eventos" }]} defaultTab="rankings">
        {(activeTab) => (
          <>
            <div className="mb-8 rounded-2xl border border-zinc-200 bg-white/50 p-6 text-center shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Prizepool Total Distribuído</div>
              <div className="mt-2 text-4xl font-black text-emerald-600 dark:text-emerald-400 md:text-5xl">{totalFormatted}</div>
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">R$1.700 pendente</div>
            </div>
            
            {activeTab === "rankings" && <RankingsView leaders={leaders} uuidMap={uuidMap} />}
            {activeTab === "events" && <EventsView events={events} />}
          </>
        )}
      </Tabs>
    </>
  );
}

function EventsView({ events }: { events: EventRow[] }) {
  const sorted = [...events].sort((a, b) => {
    const da = String(a.date ?? "").trim();
    const db = String(b.date ?? "").trim();
    return db.localeCompare(da);
  });

  return (
    <div className="space-y-3">
      <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">Eventos</h2>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          Nenhum evento encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {sorted.map((e, i) => (
            <div
              key={`${e.event}-${e.date ?? ""}-${i}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{e.event}</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {typeof e.prizepool === "number"
                    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
                        e.prizepool
                      )
                    : ""}
                </div>
              </div>

              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {e.date ?? ""}
              </div>

              {e.info ? <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">{e.info}</div> : null}

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Winners</div>
                {e.winners.length === 0 ? (
                  <div className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">-</div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {e.winners
                      .slice()
                      .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
                      .map((w, idx) => (
                        <div
                          key={`${w.name}-${idx}`}
                          className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-bold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                        >
                          {w.name} - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(w.amount)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
