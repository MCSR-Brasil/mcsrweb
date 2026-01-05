import { getDbClient } from "../db";

export type PlayerLeaderboardRow = {
  name: string;
  value: number;
  stateUF?: string | null;
};

const mockRsg: PlayerLeaderboardRow[] = [
  { name: "shy", value: 321, stateUF: "SP" },
  { name: "epnok", value: 287, stateUF: "RJ" },
  { name: "hange", value: 201, stateUF: "MG" },
  { name: "mcsrbr", value: 144, stateUF: "RS" },
  { name: "seedmaster", value: 99, stateUF: "PR" },
];

const mockRanked: PlayerLeaderboardRow[] = [
  { name: "shy", value: 1910, stateUF: "SP" },
  { name: "hange", value: 1755, stateUF: "MG" },
  { name: "epnok", value: 1690, stateUF: "RJ" },
  { name: "netherking", value: 1588, stateUF: "SC" },
  { name: "fortress", value: 1501, stateUF: "BA" },
];

export async function getRsgLeaderboard(limit = 100): Promise<PlayerLeaderboardRow[]> {
  const db = getDbClient();
  if (!db) return mockRsg.slice(0, limit);

  const res = await db.execute({
    sql: "select name, value, state_uf as stateUF from leaderboard_rsg order by value desc limit ?",
    args: [limit],
  });

  return res.rows.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? ""),
    value: Number(r.value ?? 0),
    stateUF: r.stateUF ? String(r.stateUF) : null,
  }));
}

export async function getRankedLeaderboard(limit = 100): Promise<PlayerLeaderboardRow[]> {
  const db = getDbClient();
  if (!db) return mockRanked.slice(0, limit);

  const res = await db.execute({
    sql: "select name, value, state_uf as stateUF from leaderboard_ranked order by value desc limit ?",
    args: [limit],
  });

  return res.rows.map((r: Record<string, unknown>) => ({
    name: String(r.name ?? ""),
    value: Number(r.value ?? 0),
    stateUF: r.stateUF ? String(r.stateUF) : null,
  }));
}
