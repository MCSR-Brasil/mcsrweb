import { StateLeaderboard } from "../../../components/state-leaderboard";
import { getStateLeaderboard } from "../../../lib/repositories/states";
import { readUUIDMap } from "../../../lib/uuids";

export const revalidate = 500;

export default async function StatesLeaderboardPage() {
  const [rows, uuidMap] = await Promise.all([getStateLeaderboard(), readUUIDMap()]);

  return (
    <StateLeaderboard rows={rows} uuidMap={uuidMap} />
  );
}
