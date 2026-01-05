import { PageHeader } from "../../../components/page-header";
import { PlayerLeaderboardView } from "../../../components/player-leaderboard-view";
import { getRsgLeaderboard } from "../../../lib/repositories/leaderboards";
import { readUUIDMap } from "../../../lib/uuids";

export default async function RsgLeaderboardPage() {
  const [rows, uuidMap] = await Promise.all([getRsgLeaderboard(100), readUUIDMap()]);

  return (
    <div>
      <PageHeader
        title="RSG Leaderboard"
        subtitle="Ranking geral do RSG (mock/Turso). Mostra estado do player quando disponível."
      />
      <PlayerLeaderboardView title="Top Jogadores" valueLabel="Pontos" rows={rows} uuidMap={uuidMap} />
    </div>
  );
}
