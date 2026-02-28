import { redirect } from "next/navigation";

export const revalidate = 500;

export default async function StatesLeaderboardPage() {
  redirect("/leaderboards/mc?mode=states");
}
