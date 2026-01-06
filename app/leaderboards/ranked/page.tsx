import { PageHeader } from "../../../components/page-header";
import { PlayerLeaderboardView } from "../../../components/player-leaderboard-view";
import { getRunsLeaderboard } from "../../../lib/repositories/leaderboards";
import { readUUIDMap } from "../../../lib/uuids";

export const revalidate = 500;

const CATEGORIES = ["1.16", "1.16 SSG"] as const;

export default async function RankedLeaderboardPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const selected = CATEGORIES.includes((searchParams?.category ?? "") as (typeof CATEGORIES)[number])
    ? ((searchParams?.category ?? "") as (typeof CATEGORIES)[number])
    : "1.16";

  const [runs, uuidMap] = await Promise.all([getRunsLeaderboard(selected, 100), readUUIDMap()]);
  const rows = runs.map((r) => ({ name: r.name, value: r.timeMs, stateUF: r.stateUF }));

  return (
    <div>
      <PageHeader
        title="Ranking MCSR Ranked "
        subtitle="NAO FIZ AINDA"
      />
    </div>
  );
}
