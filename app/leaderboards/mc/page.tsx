import { McRankingsPageClient } from "../../../components/mc-rankings-page-client";
import { getBackendConfig } from "../../../lib/backend-config";
import { getRankedLeaderboard, getRunsLeaderboard } from "../../../lib/repositories/leaderboards";
import { getCombinedStateLeaderboard, getCombinedStatePlayersByUF } from "../../../lib/repositories/states";
import { readUUIDMap } from "../../../lib/uuids";

export const revalidate = 500;

export default async function McRankingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; category?: string }>;
}) {
  const params = (await searchParams) ?? {};

  const cfg = getBackendConfig();
  const configDefaultMode = cfg.pages?.mc?.defaultMode ?? "rsg";
  const configDefaultCategory = cfg.pages?.mc?.rsgDefaultCategory ?? "1.16";

  const defaultMode =
    params.mode === "states"
      ? "states"
      : params.mode === "ranked"
        ? "ranked"
        : params.mode === "rsg"
          ? "rsg"
          : configDefaultMode;
  const defaultRsgCategory = params.category === "1.16 SSG" ? "1.16 SSG" : configDefaultCategory;

  const [rsg116, rsgSsg, ranked, stateRows, statePlayersByUF, uuidMap] = await Promise.all([
    getRunsLeaderboard("1.16", 100),
    getRunsLeaderboard("1.16 SSG", 100),
    getRankedLeaderboard(100),
    getCombinedStateLeaderboard(),
    getCombinedStatePlayersByUF(50),
    readUUIDMap(),
  ]);

  const rsg116Rows = rsg116.map((r) => ({
    name: r.name,
    value: r.timeMs,
    stateUF: r.stateUF,
    achievedAt: r.achievedAt,
    link: r.link,
    description: r.description,
    seed: r.seed,
    bastion: r.bastion,
  }));

  const rsgSsgRows = rsgSsg.map((r) => ({
    name: r.name,
    value: r.timeMs,
    stateUF: r.stateUF,
    achievedAt: r.achievedAt,
    link: r.link,
    description: r.description,
    seed: r.seed,
    bastion: r.bastion,
  }));

  return (
    <McRankingsPageClient
      initial={{
        uuidMap,
        rankedRows: ranked,
        rsg116Rows,
        rsgSsgRows,
        stateRows,
        statePlayersByUF,
      }}
      defaultMode={defaultMode}
      defaultRsgCategory={defaultRsgCategory}
    />
  );
}
