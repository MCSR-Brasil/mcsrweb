import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStatePlayers } from "../../../../../lib/repositories/states";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ uf: string }> }
) {
  const { uf } = await ctx.params;
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? "1.16";
  const rows = await getStatePlayers(uf, 50, category);
  return NextResponse.json({ rows });
}
