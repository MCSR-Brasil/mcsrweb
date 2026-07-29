import { BRAZIL_STATES } from "../states";
import { getRankedLeaderboard, getRunsLeaderboard, normalizeUuid, readRunnersAppsScript } from "./leaderboards";
import { normalizeName } from "../normalize";

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
  rsgTimeMs?: number | null;
  rsgAchievedAt?: string | null;
  rsgLink?: string | null;
  ssgTimeMs?: number | null;
  ssgAchievedAt?: string | null;
  ssgLink?: string | null;
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

async function buildCombinedStateData(
  maxPlayersPerState = 50,
  fresh = false
): Promise<BuiltStateData> {
  const [rsgRuns, ssgRuns, runners] = await Promise.all([
    getRunsLeaderboard("1.16", 1000, fresh),
    getRunsLeaderboard("1.16 SSG", 1000, fresh),
    readRunnersAppsScript(fresh),
  ]);

  const byUFUniquePlayers = new Map<string, Set<string>>();
  const byUFPlayers = new Map<string, Map<string, StatePlayerRow>>();

  function ensurePlayer(uf: string, name: string) {
    if (!byUFUniquePlayers.has(uf)) byUFUniquePlayers.set(uf, new Set());
    byUFUniquePlayers.get(uf)?.add(name.toLowerCase());

    if (!byUFPlayers.has(uf)) byUFPlayers.set(uf, new Map());
    const existing = byUFPlayers.get(uf)?.get(name.toLowerCase());
    if (existing) return existing;

    const row: StatePlayerRow = {
      name,
      timeMs: 0,
      stateUF: uf,
      rsgTimeMs: null,
      rsgAchievedAt: null,
      rsgLink: null,
      ssgTimeMs: null,
      ssgAchievedAt: null,
      ssgLink: null,
    };
    byUFPlayers.get(uf)?.set(name.toLowerCase(), row);
    return row;
  }

  for (const r of rsgRuns) {
    const uf = String(r.stateUF ?? "").trim().toUpperCase();
    const name = String(r.name ?? "").trim();
    if (!uf || !name) continue;

    const player = ensurePlayer(uf, name);
    if (player.rsgTimeMs == null || r.timeMs < player.rsgTimeMs) {
      player.rsgTimeMs = r.timeMs;
      player.rsgAchievedAt = r.achievedAt ?? null;
      player.rsgLink = r.link ?? null;
      player.timeMs = player.ssgTimeMs != null
        ? Math.min(player.ssgTimeMs, r.timeMs)
        : r.timeMs;
      player.category = "1.16";
      player.achievedAt = player.rsgAchievedAt;
      player.link = player.rsgLink;
    }
  }

  for (const r of ssgRuns) {
    const uf = String(r.stateUF ?? "").trim().toUpperCase();
    const name = String(r.name ?? "").trim();
    if (!uf || !name) continue;

    const player = ensurePlayer(uf, name);
    if (player.ssgTimeMs == null || r.timeMs < player.ssgTimeMs) {
      player.ssgTimeMs = r.timeMs;
      player.ssgAchievedAt = r.achievedAt ?? null;
      player.ssgLink = r.link ?? null;
      player.timeMs = player.rsgTimeMs != null
        ? Math.min(player.rsgTimeMs, r.timeMs)
        : r.timeMs;
      if (player.rsgTimeMs == null || r.timeMs < player.rsgTimeMs) {
        player.category = "1.16 SSG";
        player.achievedAt = player.ssgAchievedAt;
        player.link = player.ssgLink;
      }
    }
  }

  for (const runner of runners) {
    if (!runner.ranked) continue;
    const uf = String(runner.stateUF ?? "").trim().toUpperCase();
    const name = String(runner.name ?? "").trim();
    if (!uf || !name) continue;

    if (!byUFUniquePlayers.has(uf)) byUFUniquePlayers.set(uf, new Set());
    byUFUniquePlayers.get(uf)?.add(name.toLowerCase());
  }

  const leaderboard = BRAZIL_STATES.map((s) => ({
    uf: s.uf,
    name: s.name,
    value: byUFUniquePlayers.get(s.uf)?.size ?? 0,
    amchartsId: s.amchartsId,
  })).sort((a, b) => b.value - a.value);

  const playersByUF: StatePlayersByUF = {};
  for (const s of BRAZIL_STATES) {
    const rows = Array.from(byUFPlayers.get(s.uf)?.values() ?? []);
    playersByUF[s.uf] = rows
      .sort((a, b) => (a.rsgTimeMs ?? a.ssgTimeMs ?? Infinity) - (b.rsgTimeMs ?? b.ssgTimeMs ?? Infinity))
      .slice(0, maxPlayersPerState);
  }

  return { leaderboard, playersByUF };
}

export async function getCombinedStateLeaderboard(
  limit = 27,
  fresh = false
): Promise<StateLeaderboardRow[]> {
  const built = await buildCombinedStateData(limit, fresh);
  return built.leaderboard.slice(0, limit);
}

export async function getCombinedStatePlayersByUF(
  limitPerState = 50,
  fresh = false
): Promise<StatePlayersByUF> {
  const built = await buildCombinedStateData(limitPerState, fresh);
  return built.playersByUF;
}

export type RankedStatePlayerRow = {
  name: string;
  stateUF: string;
  uuid: string | null;
  elo: number | null;
};

export type RankedStatePlayersByUF = Record<string, RankedStatePlayerRow[]>;

type BuiltRankedStateData = {
  leaderboard: StateLeaderboardRow[];
  playersByUF: RankedStatePlayersByUF;
};

async function buildRankedStateData(
  maxPlayersPerState = 50,
  fresh = false
): Promise<BuiltRankedStateData> {
  const [runners, ranked] = await Promise.all([
    readRunnersAppsScript(fresh),
    getRankedLeaderboard(150, fresh),
  ]);

  const eloByUuid = new Map<string, number>();
  const eloByName = new Map<string, number>();
  for (const r of ranked) {
    const uuid = normalizeUuid(r.uuid);
    if (uuid) eloByUuid.set(uuid, r.value);
    eloByName.set(normalizeName(r.name), r.value);
  }

  const byUFUniquePlayers = new Map<string, Set<string>>();
  const byUFPlayers = new Map<string, RankedStatePlayerRow[]>();

  for (const runner of runners) {
    if (!runner.ranked) continue;
    const uf = String(runner.stateUF ?? "").trim().toUpperCase();
    const name = String(runner.name ?? "").trim();
    if (!uf || !name) continue;

    if (!byUFUniquePlayers.has(uf)) byUFUniquePlayers.set(uf, new Set());
    byUFUniquePlayers.get(uf)?.add(name.toLowerCase());

    const uuid = normalizeUuid(runner.uuid);
    const elo = (uuid ? eloByUuid.get(uuid) : undefined) ?? eloByName.get(normalizeName(name)) ?? null;

    if (!byUFPlayers.has(uf)) byUFPlayers.set(uf, []);
    byUFPlayers.get(uf)?.push({ name, stateUF: uf, uuid: runner.uuid ?? null, elo });
  }

  const leaderboard = BRAZIL_STATES.map((s) => ({
    uf: s.uf,
    name: s.name,
    value: byUFUniquePlayers.get(s.uf)?.size ?? 0,
    amchartsId: s.amchartsId,
  })).sort((a, b) => b.value - a.value);

  const playersByUF: RankedStatePlayersByUF = {};
  for (const s of BRAZIL_STATES) {
    const rows = byUFPlayers.get(s.uf) ?? [];
    playersByUF[s.uf] = rows
      .sort((a, b) => {
        if (a.elo != null && b.elo != null) return b.elo - a.elo;
        if (a.elo != null) return -1;
        if (b.elo != null) return 1;
        return a.name.localeCompare(b.name, "pt-BR");
      })
      .slice(0, maxPlayersPerState);
  }

  return { leaderboard, playersByUF };
}

export async function getRankedStateLeaderboard(limit = 27, fresh = false): Promise<StateLeaderboardRow[]> {
  const built = await buildRankedStateData(limit, fresh);
  return built.leaderboard.slice(0, limit);
}

export async function getRankedStatePlayersByUF(
  limitPerState = 50,
  fresh = false
): Promise<RankedStatePlayersByUF> {
  const built = await buildRankedStateData(limitPerState, fresh);
  return built.playersByUF;
}

export async function getRankedStatePlayers(
  uf: string,
  limit = 50,
  fresh = false
): Promise<RankedStatePlayerRow[]> {
  const stateUF = uf.trim().toUpperCase();
  if (!stateUF) return [];

  const playersByUF = await getRankedStatePlayersByUF(limit, fresh);
  return playersByUF[stateUF] ?? [];
}
