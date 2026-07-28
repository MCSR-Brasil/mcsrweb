import { getEarningsLeaderboard, readEarnings } from "../../../lib/earnings";
import { readUUIDMap } from "../../../lib/uuids";
import { TabContent } from "../../../components/tab-content";
import { PageHeader } from "../../../components/page-header";

export default async function EarningsLeaderboardPage() {
  const [events, uuidMap] = await Promise.all([readEarnings(), readUUIDMap()]);
  const leaders = getEarningsLeaderboard(events);

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
    <div>
      <PageHeader
        title="Ganhos de Torneios"
        subtitle="Eventos de membros/aniversario nao sao considerados para ganhos individuais."
      />
      <TabContent leaders={leaders} uuidMap={uuidMap} events={events} totalFormatted={totalFormatted} />
    </div>
  );
}
