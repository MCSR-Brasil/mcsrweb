import { NextResponse } from "next/server";
import { getDbClient } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/admin-auth";

type TournamentUpsertBody = {
  id: string;
  name: string;
  startsAt: string;
  endsAt?: string | null;
  participantsCsv?: string | null;
  type: string;
  bracketFormat?: string | null;
  losersBracketStartsRound?: number | null;
  prizepool?: string | null;
  winner?: string | null;
  bracketJson?: string | null;
};

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const res = await db.execute({
    sql: "select id, name, starts_at as startsAt, ends_at as endsAt, participants_csv as participantsCsv, type as type, bracket_format as bracketFormat, losers_bracket_starts_round as losersBracketStartsRound, prizepool, winner, bracket_json as bracketJson from tournaments order by starts_at desc",
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    startsAt: String(r.startsAt ?? ""),
    endsAt: r.endsAt ? String(r.endsAt) : null,
    participantsCsv: r.participantsCsv ? String(r.participantsCsv) : null,
    type: String(r.type ?? "event"),
    bracketFormat: r.bracketFormat ? String(r.bracketFormat) : null,
    losersBracketStartsRound:
      typeof r.losersBracketStartsRound === "number" ? r.losersBracketStartsRound : r.losersBracketStartsRound == null ? null : Number(r.losersBracketStartsRound),
    prizepool: r.prizepool ? String(r.prizepool) : null,
    winner: r.winner ? String(r.winner) : null,
    bracketJson: r.bracketJson ? String(r.bracketJson) : null,
  }));

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = (await req.json()) as Partial<TournamentUpsertBody>;
  const id = String(body.id ?? "").trim();
  const name = String(body.name ?? "").trim();
  const startsAt = String(body.startsAt ?? "").trim();
  const endsAt = body.endsAt == null ? null : String(body.endsAt).trim() || null;
  const participantsCsv = body.participantsCsv == null ? null : String(body.participantsCsv).trim() || null;
  const type = String(body.type ?? "").trim().toLowerCase();
  const bracketFormat = body.bracketFormat == null ? null : String(body.bracketFormat).trim() || null;
  const losersBracketStartsRound =
    body.losersBracketStartsRound == null ? null : Number.isFinite(Number(body.losersBracketStartsRound)) ? Math.floor(Number(body.losersBracketStartsRound)) : null;
  const prizepool = body.prizepool == null ? null : String(body.prizepool).trim();
  const winner = body.winner == null ? null : String(body.winner).trim() || null;
  const bracketJson = body.bracketJson == null ? null : String(body.bracketJson).trim() || null;

  if (!id || !name || !startsAt || !type) {
    return NextResponse.json(
      { error: "id, name, startsAt, type are required" },
      { status: 400 }
    );
  }

  if (type !== "event" && type !== "btrl" && type !== "bracket") {
    return NextResponse.json({ error: "type must be one of: event, btrl, bracket" }, { status: 400 });
  }

  await db.execute({
    sql: "insert into tournaments(id, name, starts_at, ends_at, participants_csv, type, bracket_format, losers_bracket_starts_round, prizepool, winner, bracket_json) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(id) do update set name = excluded.name, starts_at = excluded.starts_at, ends_at = excluded.ends_at, participants_csv = excluded.participants_csv, type = excluded.type, bracket_format = excluded.bracket_format, losers_bracket_starts_round = excluded.losers_bracket_starts_round, prizepool = excluded.prizepool, winner = excluded.winner, bracket_json = excluded.bracket_json, updated_at = datetime('now')",
    args: [
      id,
      name,
      startsAt,
      endsAt,
      participantsCsv,
      type,
      bracketFormat,
      losersBracketStartsRound,
      prizepool,
      winner,
      bracketJson,
    ],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(req.url);
  const id = (url.searchParams.get("id") ?? "").trim();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await db.execute({
    sql: "delete from tournaments where id = ?",
    args: [id],
  });

  return NextResponse.json({ ok: true });
}
