import { PageHeader } from "../../../components/page-header";
import { PlayerLeaderboardView } from "../../../components/player-leaderboard-view";
import { getRankedLeaderboard } from "../../../lib/repositories/leaderboards";
import { readUUIDMap } from "../../../lib/uuids";

export default async function RankedLeaderboardPage() {
  const [rows, uuidMap] = await Promise.all([getRankedLeaderboard(100), readUUIDMap()]);

  return (
    <div>
      <PageHeader
        title="Ranked Leaderboard"
        subtitle="MMR/elo (mock/Turso). No futuro: seasons, histórico e filtros."
      />
      <PlayerLeaderboardView title="Top Jogadores" valueLabel="MMR" rows={rows} uuidMap={uuidMap} />
    </div>
  );
}
