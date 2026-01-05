import { getDbClient } from "../db";

export type Tournament = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  prizepool: string;
};

export type TournamentSnapshot = {
  current: Tournament | null;
  past: Tournament[];
};

function mockData(): Tournament[] {
  const now = Date.now();
  return [
    {
      id: "mcsr-br-cup-01",
      name: "MCSR BR Cup #1",
      startsAt: new Date(now - 1000 * 60 * 60 * 24 * 1).toISOString(),
      endsAt: new Date(now + 1000 * 60 * 60 * 24 * 3).toISOString(),
      prizepool: "R$ 3.500",
    },
    {
      id: "mcsr-br-open-00",
      name: "MCSR BR Open",
      startsAt: new Date(now - 1000 * 60 * 60 * 24 * 40).toISOString(),
      endsAt: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
      prizepool: "R$ 2.000",
    },
  ];
}

function splitCurrentAndPast(rows: Tournament[], nowMs: number): TournamentSnapshot {
  const current = rows.find((t) => Date.parse(t.startsAt) <= nowMs && nowMs < Date.parse(t.endsAt)) ?? null;
  const past = rows
    .filter((t) => Date.parse(t.endsAt) <= nowMs)
    .sort((a, b) => Date.parse(b.endsAt) - Date.parse(a.endsAt));

  return { current, past };
}

export async function getTournamentSnapshot(): Promise<TournamentSnapshot> {
  const db = getDbClient();
  const nowMs = Date.now();

  if (!db) {
    return splitCurrentAndPast(mockData(), nowMs);
  }

  const res = await db.execute({
    sql: "select id, name, starts_at as startsAt, ends_at as endsAt, prizepool as prizepool from tournaments order by ends_at desc",
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    startsAt: String(r.startsAt ?? ""),
    endsAt: String(r.endsAt ?? ""),
    prizepool: String(r.prizepool ?? ""),
  }));

  return splitCurrentAndPast(rows, nowMs);
}

export async function getPastTournaments(limit = 50): Promise<Tournament[]> {
  const db = getDbClient();
  const nowMs = Date.now();

  if (!db) {
    return splitCurrentAndPast(mockData(), nowMs).past.slice(0, limit);
  }

  const res = await db.execute({
    sql: "select id, name, starts_at as startsAt, ends_at as endsAt, prizepool as prizepool from tournaments where ends_at <= datetime('now') order by ends_at desc limit ?",
    args: [limit],
  });

  return res.rows.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    startsAt: String(r.startsAt ?? ""),
    endsAt: String(r.endsAt ?? ""),
    prizepool: String(r.prizepool ?? ""),
  }));
}
