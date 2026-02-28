import { redirect } from "next/navigation";

export const revalidate = 500;

export default async function RsgLeaderboardPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const selected = searchParams?.category === "1.16 SSG" ? "1.16 SSG" : "1.16";
  redirect(`/leaderboards/mc?mode=rsg&category=${encodeURIComponent(selected)}`);
}
