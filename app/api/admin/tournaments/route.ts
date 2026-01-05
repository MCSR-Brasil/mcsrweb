import { NextResponse } from "next/server";
import { getDbClient } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/admin-auth";

type TournamentUpsertBody = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  prizepool?: string | null;
  description?: string | null;
};

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const res = await db.execute({
    sql: "select id, name, starts_at as startsAt, ends_at as endsAt, prizepool, description from tournaments order by ends_at desc",
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    name: String(r.name ?? ""),
    startsAt: String(r.startsAt ?? ""),
    endsAt: String(r.endsAt ?? ""),
    prizepool: r.prizepool ? String(r.prizepool) : null,
    description: r.description ? String(r.description) : null,
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
  const endsAt = String(body.endsAt ?? "").trim();

  if (!id || !name || !startsAt || !endsAt) {
    return NextResponse.json(
      { error: "id, name, startsAt, endsAt are required" },
      { status: 400 }
    );
  }

  await db.execute({
    sql: "insert into tournaments(id, name, starts_at, ends_at, prizepool, description) values (?, ?, ?, ?, ?, ?) on conflict(id) do update set name = excluded.name, starts_at = excluded.starts_at, ends_at = excluded.ends_at, prizepool = excluded.prizepool, description = excluded.description",
    args: [id, name, startsAt, endsAt, body.prizepool ?? null, body.description ?? null],
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
