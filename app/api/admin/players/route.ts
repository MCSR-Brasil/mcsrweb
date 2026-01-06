import { NextResponse } from "next/server";
import { getDbClient } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/admin-auth";

type PlayerUpsertBody = {
  uuid: string;
  name: string;
  stateUF?: string | null;
  countryCode?: string | null;
};

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const res = await db.execute({
    sql: q
      ? "select uuid, name, state_uf as stateUF from players where name_norm like ? order by name asc limit ?"
      : "select uuid, name, state_uf as stateUF from players order by name asc limit ?",
    args: q ? [`%${q}%`, limit] : [limit],
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    uuid: String(r.uuid ?? ""),
    name: String(r.name ?? ""),
    stateUF: r.stateUF ? String(r.stateUF) : null,
  }));

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = (await req.json()) as Partial<PlayerUpsertBody>;
  const uuid = String(body.uuid ?? "").trim();
  const name = String(body.name ?? "").trim();
  const stateUF = body.stateUF == null ? null : String(body.stateUF).trim().toUpperCase();
  const countryCode = body.countryCode == null ? null : String(body.countryCode).trim().toUpperCase();

  if (!uuid || !name) {
    return NextResponse.json({ error: "uuid and name are required" }, { status: 400 });
  }

  await db.execute({
    sql: "insert into players(uuid, name, state_uf, country_code) values (?, ?, ?, coalesce(?, 'BR')) on conflict(uuid) do update set name = excluded.name, state_uf = excluded.state_uf, country_code = excluded.country_code, updated_at = datetime('now')",
    args: [uuid, name, stateUF, countryCode],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(req.url);
  const uuid = (url.searchParams.get("uuid") ?? "").trim();
  if (!uuid) return NextResponse.json({ error: "uuid is required" }, { status: 400 });

  await db.execute({
    sql: "delete from players where uuid = ?",
    args: [uuid],
  });

  return NextResponse.json({ ok: true });
}
