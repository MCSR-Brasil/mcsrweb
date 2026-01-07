import { getDbClient } from "../db";
import { BRAZIL_STATES } from "../states";

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

type RankedApiResponse = {
  status?: string;
  data?: {
    statistics?: {
      total?: {
        bestTime?: {
          ranked?: number | null;
        };
      };
    };
  };
};

export async function getStateLeaderboard(limit = 27): Promise<StateLeaderboardRow[]> {
  const db = getDbClient();
  if (!db) return [];

  try {
    const res = await db.execute({
      sql: "select state_uf as uf, count(*) as value from players group by state_uf order by value desc",
    });

    const byUF = new Map<string, number>();
    for (const r of res.rows) {
      const uf = String(r.uf ?? "").toUpperCase();
      const value = Number(r.value ?? 0);
      if (!uf) continue;
      byUF.set(uf, value);
    }

    const rows = BRAZIL_STATES.map((s) => ({
      uf: s.uf,
      name: s.name,
      value: byUF.get(s.uf) ?? 0,
      amchartsId: s.amchartsId,
    })).sort((a, b) => b.value - a.value);

    return rows.slice(0, limit);
  } catch {
    return [];
  }
}

async function asyncPool<T, R>(
  concurrency: number,
  items: readonly T[],
  worker: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: Math.max(1, concurrency) }).map(async () => {
    while (true) {
      const idx = nextIndex;
      nextIndex++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx], idx);
    }
  });

  await Promise.all(runners);
  return results;
}

async function fetchRankedBestTimeMsByUuid(uuid: string): Promise<number | null> {
  const id = uuid.trim();
  if (!id) return null;

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 3500);
  try {
    const res = await fetch(`https://mcsrranked.com/api/users/${encodeURIComponent(id)}`, {
      signal: ac.signal,
      // Cache the external API call on the server to reduce rate limiting.
      next: { revalidate: 60 * 60 },
      headers: {
        accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as RankedApiResponse;
    const ms = json?.data?.statistics?.total?.bestTime?.ranked;
    return typeof ms === "number" && Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function getStatePlayersRanked(uf: string, limit = 50): Promise<StatePlayerRow[]> {
  const stateUF = uf.trim().toUpperCase();
  if (!stateUF) return [];

  const db = getDbClient();
  if (!db) return [];

  try {
    const res = await db.execute({
      sql: "select uuid, name, state_uf as stateUF from players where state_uf = ? order by name asc",
      args: [stateUF],
    });

    const players = res.rows
      .map((r: Record<string, unknown>) => ({
        uuid: String(r.uuid ?? "").trim(),
        name: String(r.name ?? "").trim(),
      }))
      .filter((p) => p.uuid && p.name);

    const fetched = await asyncPool<typeof players[number], StatePlayerRow | null>(4, players, async (p) => {
      const timeMs = await fetchRankedBestTimeMsByUuid(p.uuid);
      if (timeMs == null) return null;
      return {
        name: p.name,
        timeMs,
        stateUF,
        category: "Ranked",
        achievedAt: null,
        link: null,
      };
    });

    return fetched
      .filter((x): x is StatePlayerRow => x != null)
      .sort((a, b) => a.timeMs - b.timeMs)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export async function getStatePlayers(uf: string, limit = 50, category = "Any%" as string): Promise<StatePlayerRow[]> {
  const stateUF = uf.trim().toUpperCase();
  if (!stateUF) return [];
  const cat = category.trim() || "Any%";

  if (cat.toLowerCase() === "ranked") {
    return getStatePlayersRanked(stateUF, limit);
  }

  const db = getDbClient();
  if (!db) {
    return [];
  }

  try {
    const res = await db.execute({
      sql: "\n      select\n        p.name as name,\n        b.time_ms as timeMs,\n        p.state_uf as stateUF,\n        b.category as category,\n        b.achieved_at as achievedAt,\n        b.link as link\n      from players p\n      join v_player_best_runs b on b.player_uuid = p.uuid\n      where p.state_uf = ? and b.category = ?\n      order by b.time_ms asc\n      limit ?\n    ",
      args: [stateUF, cat, limit],
    });

    return res.rows.map((r: Record<string, unknown>) => ({
      name: String(r.name ?? ""),
      timeMs: Number(r.timeMs ?? 0),
      stateUF: String(r.stateUF ?? stateUF),
      category: r.category ? String(r.category) : undefined,
      achievedAt: r.achievedAt ? String(r.achievedAt) : null,
      link: r.link ? String(r.link) : null,
    }));
  } catch {
    return [];
  }
}
