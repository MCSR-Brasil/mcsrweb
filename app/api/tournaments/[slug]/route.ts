import { NextResponse } from "next/server";
import { getTournamentPageData } from "../../../../lib/repositories/tournaments";

export const revalidate = 0;

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const data = await getTournamentPageData(slug, true);

  if (!data) {
    return NextResponse.json(
      { error: "Tournament not found" },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
