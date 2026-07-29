import { NextResponse } from "next/server";
import { getRankedStatePlayers, getStatePlayers } from "../../../../../lib/repositories/states";

export const revalidate = 500;

export async function GET(req: Request, context: { params: Promise<{ uf: string }> }) {
  const { uf: rawUf } = await context.params;
  const uf = String(rawUf ?? "").trim().toUpperCase();
  const { searchParams } = new URL(req.url);
  const rawCategory = String(searchParams.get("category") ?? "1.16").trim();
  const category: "1.16" | "1.16 SSG" | "ranked" =
    rawCategory === "1.16 SSG" ? "1.16 SSG" : rawCategory === "ranked" ? "ranked" : "1.16";
  const limitRaw = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 50;

  if (!uf) {
    return NextResponse.json(
      { rows: [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=500, stale-while-revalidate=86400",
        },
      }
    );
  }

  const rows =
    category === "ranked" ? await getRankedStatePlayers(uf, limit) : await getStatePlayers(uf, limit, category);
  return NextResponse.json(
    { rows },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=500, stale-while-revalidate=86400",
      },
    }
  );
}
