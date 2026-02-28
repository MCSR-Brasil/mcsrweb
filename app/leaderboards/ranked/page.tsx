import { redirect } from "next/navigation";

export const revalidate = 500;

export default async function RankedLeaderboardPage({
  searchParams: _searchParams,
}: {
  searchParams?: { category?: string };
}) {
  void _searchParams;
  redirect("/leaderboards/mc?mode=ranked");
}
