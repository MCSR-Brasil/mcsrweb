"use client";

import { RankingsView } from "./rankings-view";
import { EventsView } from "./events-view";
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
              <div className="mt-2 text-sm font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">R$2.800 pendente</div>
            </div>
            
            {activeTab === "rankings" && <RankingsView leaders={leaders} uuidMap={uuidMap} />}
            {activeTab === "events" && <EventsView events={events} />}
          </>
        )}
      </Tabs>
    </>
  );
}
