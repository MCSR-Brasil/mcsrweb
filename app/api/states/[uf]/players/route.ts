import { NextResponse } from "next/server";
import { getStatePlayers } from "../../../../../lib/repositories/states";

export const revalidate = 0;

export async function GET(req: Request, context: { params: Promise<{ uf: string }> }) {
  const { uf: rawUf } = await context.params;
  const uf = String(rawUf ?? "").trim().toUpperCase();
  const { searchParams } = new URL(req.url);
  const category = String(searchParams.get("category") ?? "1.16").trim();
  const limitRaw = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 50;

  if (!uf) {
    return NextResponse.json({ rows: [] }, { status: 200 });
  }

  const rows = await getStatePlayers(uf, limit, category);
  return NextResponse.json({ rows }, { status: 200 });
}
