import { NextResponse } from "next/server";
import { getDbClient } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/admin-auth";

type CreatePbRunBody = {
  playerUUID: string;
  category: string;
  timeMs: number;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

type PbRun = {
  id: number;
  playerUUID: string;
  category: string;
  timeMs: number;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

export async function GET(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const url = new URL(req.url);
  const playerUUID = (url.searchParams.get("playerUUID") ?? "").trim();
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));

  const res = await db.execute({
    sql: playerUUID
      ? "select id, player_uuid as playerUUID, category, time_ms as timeMs, achieved_at as achievedAt, link, description, seed, bastion from pb_runs where player_uuid = ? order by time_ms asc limit ?"
      : "select id, player_uuid as playerUUID, category, time_ms as timeMs, achieved_at as achievedAt, link, description, seed, bastion from pb_runs order by id desc limit ?",
    args: playerUUID ? [playerUUID, limit] : [limit],
  });

  const rows = res.rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id ?? 0),
    playerUUID: String(r.playerUUID ?? ""),
    category: String(r.category ?? ""),
    timeMs: Number(r.timeMs ?? 0),
    achievedAt: r.achievedAt ? String(r.achievedAt) : null,
    link: r.link ? String(r.link) : null,
    description: r.description ? String(r.description) : null,
    seed: r.seed ? String(r.seed) : null,
    bastion: r.bastion ? String(r.bastion) : null,
  }));

  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const auth = requireAdmin(req);
  if (auth) return auth;

  const db = getDbClient();
  if (!db) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

  const body = (await req.json()) as Partial<CreatePbRunBody>;
  const playerUUID = String(body.playerUUID ?? "").trim();
  const category = String(body.category ?? "").trim();
  const timeMs = Number(body.timeMs ?? NaN);

  if (!playerUUID || !category || !Number.isFinite(timeMs) || timeMs <= 0) {
    return NextResponse.json(
      { error: "playerUUID, category, timeMs are required" },
      { status: 400 }
    );
  }

  await db.execute({
    sql: "insert into pb_runs(player_uuid, category, time_ms, achieved_at, link, description, seed, bastion) values (?, ?, ?, ?, ?, ?, ?, ?)",
    args: [
      playerUUID,
      category,
      Math.floor(timeMs),
      body.achievedAt ?? null,
      body.link ?? null,
      body.description ?? null,
      body.seed ?? null,
      body.bastion ?? null,
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
  const id = Number(url.searchParams.get("id") ?? NaN);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await db.execute({
    sql: "delete from pb_runs where id = ?",
    args: [id],
  });

  return NextResponse.json({ ok: true });
}
