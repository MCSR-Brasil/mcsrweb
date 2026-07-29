import { NextResponse } from "next/server";
import { getRankedLeaderboard, getRunsLeaderboard } from "../../../../lib/repositories/leaderboards";
import {
  getCombinedStateLeaderboard,
  getCombinedStatePlayersByUF,
  getRankedStatePlayersByUF,
} from "../../../../lib/repositories/states";
import { readUUIDMap } from "../../../../lib/uuids";

export const revalidate = 0;

export async function GET() {
  const [rsg116, rsgSsg, ranked, stateRows, statePlayersByUF, rankedStatePlayersByUF, uuidMap] = await Promise.all([
    getRunsLeaderboard("1.16", 100, true),
    getRunsLeaderboard("1.16 SSG", 100, true),
    getRankedLeaderboard(100, true),
    getCombinedStateLeaderboard(),
    getCombinedStatePlayersByUF(50),
    getRankedStatePlayersByUF(50, true),
    readUUIDMap(undefined, true),
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

  return NextResponse.json(
    {
      rsg116Rows,
      rsgSsgRows,
      rankedRows: ranked,
      stateRows,
      statePlayersByUF,
      rankedStatePlayersByUF,
      uuidMap,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
