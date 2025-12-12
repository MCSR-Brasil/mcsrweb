import { getLeaderboardFromCSV, readEarningsCSV } from "../lib/earnings";
import { readUUIDMap } from "../lib/uuids";
import { TabContent } from "../components/tab-content";

export default async function Home() {
  const [leaders, uuidMap, events] = await Promise.all([
    getLeaderboardFromCSV(),
    readUUIDMap(),
    readEarningsCSV(),
  ]);
  const leadersTotal = leaders.reduce((sum, l) => sum + l.earnings, 0);
  const emptyWinnersPrizepool = events
    .filter((e) => (e.winners?.length ?? 0) === 0 && typeof e.prizepool === "number")
    .reduce((sum, e) => sum + (e.prizepool as number), 0);
  const total = leadersTotal + emptyWinnersPrizepool;
  const totalFormatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(total);
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent" />
        
        <main className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <header className="mb-12 text-center">
            <h1 className="mb-3 bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-50 sm:text-6xl md:text-7xl">
              Torneios
            </h1>
            <p className="mx-auto max-w-2xl text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
              Eventos sem vencedores individuais (300/400 membros) incluídos no total
            </p>
          </header>

          <TabContent leaders={leaders} uuidMap={uuidMap} events={events} totalFormatted={totalFormatted} />
        </main>
      </div>
    </div>
  );
}
