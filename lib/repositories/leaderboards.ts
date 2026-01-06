import { getDbClient } from "../db";

export type PlayerLeaderboardRow = {
  name: string;
  value: number;
  stateUF?: string | null;
};

export type RunLeaderboardRow = {
  name: string;
  timeMs: number;
  stateUF?: string | null;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

const mockRuns: RunLeaderboardRow[] = [
  { name: "shy", timeMs: 512345, stateUF: "SP" },
  { name: "hange", timeMs: 520420, stateUF: "MG" },
  { name: "epnok", timeMs: 533000, stateUF: "RJ" },
  { name: "seedmaster", timeMs: 545120, stateUF: "SP" },
  { name: "fortress", timeMs: 579991, stateUF: "SP" },
];

const mockRanked: PlayerLeaderboardRow[] = [
  { name: "shy", value: 1910, stateUF: "SP" },
  { name: "hange", value: 1755, stateUF: "MG" },
  { name: "epnok", value: 1690, stateUF: "RJ" },
  { name: "netherking", value: 1588, stateUF: "SC" },
  { name: "fortress", value: 1501, stateUF: "BA" },
];

export async function getRsgLeaderboard(limit = 100): Promise<PlayerLeaderboardRow[]> {
  void limit;
  return [];
}

export async function getRunsLeaderboard(category: string, limit = 100): Promise<RunLeaderboardRow[]> {
  const cat = category.trim();
  const db = getDbClient();
  if (!db) return mockRuns.slice(0, limit);

  try {
    const res = await db.execute({
      sql: "select p.name as name, p.state_uf as stateUF, b.time_ms as timeMs, b.achieved_at as achievedAt, b.link as link, b.description as description, b.seed as seed, b.bastion as bastion from v_player_best_runs b join players p on p.uuid = b.player_uuid where b.category = ? order by b.time_ms asc limit ?",
      args: [cat, limit],
    });

    return res.rows.map((r: Record<string, unknown>) => ({
      name: String(r.name ?? ""),
      timeMs: Number(r.timeMs ?? 0),
      stateUF: r.stateUF ? String(r.stateUF) : null,
      achievedAt: r.achievedAt ? String(r.achievedAt) : null,
      link: r.link ? String(r.link) : null,
      description: r.description ? String(r.description) : null,
      seed: r.seed ? String(r.seed) : null,
      bastion: r.bastion ? String(r.bastion) : null,
    }));
  } catch {
    return mockRuns.slice(0, limit);
  }
}

export async function getRankedLeaderboard(limit = 100): Promise<PlayerLeaderboardRow[]> {
  return mockRanked.slice(0, limit);
}
