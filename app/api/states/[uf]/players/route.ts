import { NextResponse } from "next/server";
import { getStatePlayers } from "../../../../../lib/repositories/states";

export async function GET(
  req: Request,
  ctx: { params: { uf: string } }
) {
  const { uf } = ctx.params;
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "Any%";
  const rows = await getStatePlayers(uf, 50, category);
  return NextResponse.json({ rows });
}
