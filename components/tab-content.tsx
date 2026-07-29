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
            
            {activeTab === "rankings" && <RankingsView leaders={leaders} uuidMap={uuidMap} events={events} />}
            {activeTab === "events" && <EventsView events={events} />}
          </>
        )}
      </Tabs>
    </>
  );
}

function parseEventDateMs(raw: string | null): number {
  const text = String(raw ?? "").trim();
  if (!text) return 0;
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct.getTime();

  const m = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (!m) return 0;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const yearRaw = Number(m[3]);
  const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return 0;
  const d = new Date(year, month - 1, day);
  const ms = d.getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function formatEventDate(raw: string | null): string {
  const ms = parseEventDateMs(raw);
  if (!ms) return raw ?? "";
  return new Date(ms).toLocaleDateString("pt-BR");
}

function EventsView({ events }: { events: EventRow[] }) {
  const sorted = [...events].sort((a, b) => {
    const ta = parseEventDateMs(a.date);
    const tb = parseEventDateMs(b.date);
    if (tb !== ta) return tb - ta;
    return String(a.event ?? "").localeCompare(String(b.event ?? ""), "pt-BR");
  });

  return (
    <div className="space-y-4">
      <h2 className="font-minecraft mb-6 text-center text-2xl font-normal text-card-foreground md:text-3xl">Eventos</h2>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm font-medium text-muted-foreground">
          Nenhum evento encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sorted.map((e, i) => {
            const winners = [...e.winners].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
            return (
              <div
                key={`${e.event}-${e.date ?? ""}-${i}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-minecraft text-xl font-normal text-card-foreground">{e.event}</h3>
                    <div className="mt-1 text-sm text-muted-foreground">{formatEventDate(e.date)}</div>
                  </div>
                  {typeof e.prizepool === "number" ? (
                    <div className="shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-black text-primary">
                      Prize pool {formatCurrency(e.prizepool)}
                    </div>
                  ) : null}
                </div>

                {e.info ? (
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{e.info}</p>
                ) : null}

                {winners.length > 0 ? (
                  <div className="mt-5">
                    <div className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">Vencedores</div>
                    <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                      {winners.map((w, idx) => (
                        <div
                          key={`${w.name}-${idx}`}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={[
                                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black tabular-nums",
                                winnerRankClass(idx + 1),
                              ].join(" ")}
                            >
                              {idx + 1}
                            </div>
                            <span className="font-semibold text-card-foreground">{w.name}</span>
                          </div>
                          <span className="font-black text-primary">{formatCurrency(w.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 text-sm font-medium text-muted-foreground">Nenhum vencedor registrado.</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function winnerRankClass(rank: number): string {
  if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-amber-500 text-white";
  if (rank === 2) return "bg-gradient-to-br from-zinc-300 to-zinc-400 text-zinc-900";
  if (rank === 3) return "bg-gradient-to-br from-amber-700 to-amber-800 text-white";
  return "bg-secondary text-secondary-foreground";
}
