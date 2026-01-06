import { getDbClient } from "../db";

export type TournamentType = "event" | "btrl" | "bracket";
export type BracketFormat = "single_elim" | "double_elim";

export type Tournament = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  participantsCsv: string | null;
  type: TournamentType;
  bracketFormat: BracketFormat | null;
  losersBracketStartsRound: number | null;
  prizepool: string | null;
  winner: string | null;
  bracketJson: string | null;
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
      participantsCsv: "",
      type: "bracket",
      bracketFormat: "single_elim",
      losersBracketStartsRound: null,
      prizepool: "R$ 3.500",
      winner: null,
      bracketJson: null,
    },
    {
      id: "mcsr-br-open-00",
      name: "MCSR BR Open",
      startsAt: new Date(now - 1000 * 60 * 60 * 24 * 40).toISOString(),
      endsAt: new Date(now - 1000 * 60 * 60 * 24 * 30).toISOString(),
      participantsCsv: "",
      type: "event",
      bracketFormat: null,
      losersBracketStartsRound: null,
      prizepool: "R$ 2.000",
      winner: null,
      bracketJson: null,
    },
  ];
}

function splitCurrentAndPast(rows: Tournament[], nowMs: number): TournamentSnapshot {
  const current =
    rows
      .filter((t) => {
        const start = Date.parse(t.startsAt);
        const end = t.endsAt ? Date.parse(t.endsAt) : Number.POSITIVE_INFINITY;
        if (!Number.isFinite(start)) return false;
        return start <= nowMs && nowMs < end;
      })
      .sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))[0] ?? null;
  const past = rows
    .filter((t) => (t.endsAt ? Date.parse(t.endsAt) <= nowMs : false))
    .sort((a, b) => Date.parse(b.endsAt ?? "") - Date.parse(a.endsAt ?? ""));

  return { current, past };
}

function toTournament(r: Record<string, unknown>): Tournament {
  const typeRaw = String(r.type ?? "event").toLowerCase();
  const type: TournamentType = typeRaw === "bracket" ? "bracket" : typeRaw === "btrl" ? "btrl" : "event";

  const bfRaw = String(r.bracketFormat ?? "").toLowerCase();
  const bracketFormat: BracketFormat | null =
    bfRaw === "double_elim" ? "double_elim" : bfRaw === "single_elim" ? "single_elim" : null;

  const losers = r.losersBracketStartsRound == null ? null : Number(r.losersBracketStartsRound);

  return {
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    startsAt: String(r.startsAt ?? ""),
    endsAt: r.endsAt ? String(r.endsAt) : null,
    participantsCsv: r.participantsCsv ? String(r.participantsCsv) : null,
    type,
    bracketFormat,
    losersBracketStartsRound: Number.isFinite(losers as number) ? Math.floor(losers as number) : null,
    prizepool: r.prizepool ? String(r.prizepool) : null,
    winner: r.winner ? String(r.winner) : null,
    bracketJson: r.bracketJson ? String(r.bracketJson) : null,
  };
}

export async function getTournaments(limit = 50): Promise<Tournament[]> {
  const db = getDbClient();
  const nowMs = Date.now();

  if (!db) {
    return splitCurrentAndPast(mockData(), nowMs).past.slice(0, limit);
  }

  try {
    const res = await db.execute({
      sql: "select id, name, starts_at as startsAt, ends_at as endsAt, participants_csv as participantsCsv, type as type, bracket_format as bracketFormat, losers_bracket_starts_round as losersBracketStartsRound, prizepool as prizepool, winner as winner, bracket_json as bracketJson from tournaments order by starts_at desc limit ?",
      args: [limit],
    });
    return res.rows.map((row: Record<string, unknown>) => toTournament(row));
  } catch {
    return splitCurrentAndPast(mockData(), nowMs).past.slice(0, limit);
  }
}

export async function getTournamentById(id: string): Promise<Tournament | null> {
  const db = getDbClient();
  if (!db) {
    const key = String(id ?? "").trim();
    if (!key) return null;
    return mockData().find((t) => t.id === key) ?? null;
  }

  try {
    const res = await db.execute({
      sql: "select id, name, starts_at as startsAt, ends_at as endsAt, participants_csv as participantsCsv, type as type, bracket_format as bracketFormat, losers_bracket_starts_round as losersBracketStartsRound, prizepool as prizepool, winner as winner, bracket_json as bracketJson from tournaments where id = ?",
      args: [id],
    });
    const row = res.rows[0] as Record<string, unknown> | undefined;
    return row ? toTournament(row) : null;
  } catch {
    return null;
  }
}

export async function getTournamentSnapshot(): Promise<TournamentSnapshot> {
  const db = getDbClient();
  const nowMs = Date.now();

  if (!db) {
    return splitCurrentAndPast(mockData(), nowMs);
  }

  try {
    const res = await db.execute({
      sql: "select id, name, starts_at as startsAt, ends_at as endsAt, participants_csv as participantsCsv, type as type, bracket_format as bracketFormat, losers_bracket_starts_round as losersBracketStartsRound, prizepool as prizepool, winner as winner, bracket_json as bracketJson from tournaments order by starts_at desc",
    });

    const rows = res.rows.map((r: Record<string, unknown>) => toTournament(r));

    return splitCurrentAndPast(rows, nowMs);
  } catch {
    return splitCurrentAndPast(mockData(), nowMs);
  }
}

export async function getPastTournaments(limit = 50): Promise<Tournament[]> {
  const db = getDbClient();
  const nowMs = Date.now();

  if (!db) {
    return splitCurrentAndPast(mockData(), nowMs).past.slice(0, limit);
  }

  try {
    const res = await db.execute({
      sql: "select id, name, starts_at as startsAt, ends_at as endsAt, participants_csv as participantsCsv, type as type, bracket_format as bracketFormat, losers_bracket_starts_round as losersBracketStartsRound, prizepool as prizepool, winner as winner, bracket_json as bracketJson from tournaments where ends_at is not null and ends_at <= datetime('now') order by ends_at desc limit ?",
      args: [limit],
    });

    return res.rows.map((r: Record<string, unknown>) => toTournament(r));
  } catch {
    return splitCurrentAndPast(mockData(), nowMs).past.slice(0, limit);
  }
}
