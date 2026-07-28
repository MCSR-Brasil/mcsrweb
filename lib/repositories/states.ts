import { BRAZIL_STATES } from "../states";
import { getRunsLeaderboard } from "./leaderboards";

export type StateLeaderboardRow = {
  uf: string;
  name: string;
  value: number;
  amchartsId: string;
};

export type StatePlayerRow = {
  name: string;
  timeMs: number;
  stateUF: string;
  category?: string;
  achievedAt?: string | null;
  link?: string | null;
};

export type StatePlayersByUF = Record<string, StatePlayerRow[]>;

export type StateCategory = "1.16" | "1.16 SSG";

type BuiltStateData = {
  leaderboard: StateLeaderboardRow[];
  playersByUF: StatePlayersByUF;
};

async function buildStateData(
  category: StateCategory = "1.16",
  maxPlayersPerState = 50,
  fresh = false
): Promise<BuiltStateData> {
  const runs = await getRunsLeaderboard(category, 1000, fresh);

  const byUFUniquePlayers = new Map<string, Set<string>>();
  const byUFPlayers = new Map<string, StatePlayerRow[]>();

  for (const r of runs) {
    const uf = String(r.stateUF ?? "").trim().toUpperCase();
    const name = String(r.name ?? "").trim();
    if (!uf || !name) continue;

    if (!byUFUniquePlayers.has(uf)) byUFUniquePlayers.set(uf, new Set());
    byUFUniquePlayers.get(uf)?.add(name.toLowerCase());

    if (!byUFPlayers.has(uf)) byUFPlayers.set(uf, []);
    byUFPlayers.get(uf)?.push({
      name: r.name,
      timeMs: r.timeMs,
      stateUF: uf,
      category: r.category,
      achievedAt: r.achievedAt ?? null,
      link: r.link ?? null,
    });
  }

  const leaderboard = BRAZIL_STATES.map((s) => ({
    uf: s.uf,
    name: s.name,
    value: byUFUniquePlayers.get(s.uf)?.size ?? 0,
    amchartsId: s.amchartsId,
  })).sort((a, b) => b.value - a.value);

  const playersByUF: StatePlayersByUF = {};
  for (const s of BRAZIL_STATES) {
    const rows = byUFPlayers.get(s.uf) ?? [];
    playersByUF[s.uf] = rows.sort((a, b) => a.timeMs - b.timeMs).slice(0, maxPlayersPerState);
  }

  return { leaderboard, playersByUF };
}

export async function getStateLeaderboard(
  category: StateCategory = "1.16",
  limit = 27,
  fresh = false
): Promise<StateLeaderboardRow[]> {
  const built = await buildStateData(category, limit, fresh);
  return built.leaderboard.slice(0, limit);
}

export async function getStatePlayersByUF(
  category: StateCategory = "1.16",
  limitPerState = 50,
  fresh = false
): Promise<StatePlayersByUF> {
  const built = await buildStateData(category, limitPerState, fresh);
  return built.playersByUF;
}

export async function getStatePlayers(
  uf: string,
  limit = 50,
  category: StateCategory = "1.16",
  fresh = false
): Promise<StatePlayerRow[]> {
  const stateUF = uf.trim().toUpperCase();
  if (!stateUF) return [];

  const playersByUF = await getStatePlayersByUF(category, limit, fresh);
  return playersByUF[stateUF] ?? [];
}
