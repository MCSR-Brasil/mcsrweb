import { notFound } from "next/navigation";
import { TournamentRefreshClient } from "../../../components/tournament-refresh-client";
import { getTournamentPageData } from "../../../lib/repositories/tournaments";

type TournamentPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const revalidate = 500;

export default async function TournamentDetailPage({ params }: TournamentPageProps) {
  const { slug } = await params;
  const data = await getTournamentPageData(slug);
  if (!data) return notFound();

  return <TournamentRefreshClient initial={data} slug={slug} />;
}
