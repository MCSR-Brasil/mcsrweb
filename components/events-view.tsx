"use client";

type Winner = { name: string; amount: number };
type EventRow = {
  event: string;
  prizepool: number | null;
  date: string | null;
  info: string | null;
  winners: Winner[];
};

export function EventsView({ events }: { events: EventRow[] }) {
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.date ? new Date(a.date.split("/").reverse().join("-")) : new Date(0);
    const dateB = b.date ? new Date(b.date.split("/").reverse().join("-")) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-3">
      <h2 className="mb-6 text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">Histórico de Eventos</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sortedEvents.map((event, i) => (
          <EventCard key={`${event.event}-${i}`} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: EventRow }) {
  const hasWinners = event.winners && event.winners.length > 0;
  const prizeFormatted = event.prizepool
    ? new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0,
      }).format(event.prizepool)
    : "N/A";

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full" />
      
      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{event.event}</h3>
            {event.date && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{event.date}</p>
            )}
          </div>
          <div className="shrink-0 rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            {prizeFormatted}
          </div>
        </div>

        {event.info && (
          <p className="mb-3 text-sm italic text-zinc-600 dark:text-zinc-400">
            {event.info}
          </p>
        )}

        {hasWinners ? (
          <div className="mt-4 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Vencedores
            </div>
            <div className="flex flex-wrap gap-2">
              {event.winners.map((w, idx) => (
                <div
                  key={`${w.name}-${idx}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{w.name}</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    R${w.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="">
           
          </div>
        )}
      </div>
    </div>
  );
}
