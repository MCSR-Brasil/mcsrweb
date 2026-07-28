import { NextResponse } from "next/server";
import { getEarningsLeaderboard, readEarnings } from "../../../lib/earnings";
import { readUUIDMap } from "../../../lib/uuids";

export const revalidate = 0;

export async function GET() {
  const [events, uuidMap] = await Promise.all([readEarnings(true), readUUIDMap(undefined, true)]);
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

  return NextResponse.json(
    { events, uuidMap, leaders, totalFormatted },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
