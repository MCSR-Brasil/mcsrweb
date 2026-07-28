"use client";

import { useBackgroundRefresh } from "../hooks/use-background-refresh";
import type { TournamentPageData } from "../lib/repositories/tournaments";
import { TournamentPageRenderer } from "./tournament-page-renderer";

export function TournamentRefreshClient({
  initial,
  slug,
}: {
  initial: TournamentPageData;
  slug: string;
}) {
  const { data } = useBackgroundRefresh<TournamentPageData>(
    initial,
    `/api/tournaments/${encodeURIComponent(slug)}`,
    { refreshIntervalMs: 300_000 }
  );

  return <TournamentPageRenderer data={data} />;
}
