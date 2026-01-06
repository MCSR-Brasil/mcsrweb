import { NextResponse } from "next/server";
import { getDbClient } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/admin-auth";

type UpsertRankedScoreBody = {
  playerUUID: string;
  value: number;
  source?: string | null;
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
      ? "select p.uuid as playerUUID, p.name as name, p.state_uf as stateUF, s.value as value, s.source as source, s.updated_at as updatedAt from ranked_scores s join players p on p.uuid = s.player_uuid where p.name_norm like ? order by s.value desc limit ?"
      : "select p.uuid as playerUUID, p.name as name, p.state_uf as stateUF, s.value as value, s.source as source, s.updated_at as updatedAt from ranked_scores s join players p on p.uuid = s.player_uuid order by s.value desc limit ?",
    args: q ? [`%${q}%`, limit] : [limit],
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    playerUUID: String(r.playerUUID ?? ""),
    name: String(r.name ?? ""),
    stateUF: r.stateUF ? String(r.stateUF) : null,
    value: Number(r.value ?? 0),
    source: r.source ? String(r.source) : null,
    updatedAt: String(r.updatedAt ?? ""),
  }));

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = (await req.json()) as Partial<UpsertRankedScoreBody>;
  const playerUUID = String(body.playerUUID ?? "").trim();
  const value = Number(body.value ?? NaN);
  const source = body.source == null ? null : String(body.source).trim();

  if (!playerUUID || !Number.isFinite(value)) {
    return NextResponse.json({ error: "playerUUID and value are required" }, { status: 400 });
  }

  await db.execute({
    sql: "insert into ranked_scores(player_uuid, value, source, updated_at) values (?, ?, ?, datetime('now')) on conflict(player_uuid) do update set value = excluded.value, source = excluded.source, updated_at = datetime('now')",
    args: [playerUUID, Math.floor(value), source],
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(req.url);
  const playerUUID = (url.searchParams.get("playerUUID") ?? "").trim();
  if (!playerUUID) {
    return NextResponse.json({ error: "playerUUID is required" }, { status: 400 });
  }

  await db.execute({
    sql: "delete from ranked_scores where player_uuid = ?",
    args: [playerUUID],
  });

  return NextResponse.json({ ok: true });
}
