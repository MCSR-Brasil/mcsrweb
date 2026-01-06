import { PageHeader } from "../../../components/page-header";
import { PlayerLeaderboardView } from "../../../components/player-leaderboard-view";
import { getRunsLeaderboard } from "../../../lib/repositories/leaderboards";
import { readUUIDMap } from "../../../lib/uuids";

const CATEGORIES = ["1.16", "1.16 SSG"] as const;

function formatTimeMs(ms: number) {
  const v = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(v / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = v % 1000;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(millis).padStart(3, "0");
  return `${mm}:${ss}.${mmm}`;
}

export default async function RsgLeaderboardPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const selected = CATEGORIES.includes((searchParams?.category ?? "") as (typeof CATEGORIES)[number])
    ? ((searchParams?.category ?? "") as (typeof CATEGORIES)[number])
    : "1.16";

  const [runs, uuidMap] = await Promise.all([getRunsLeaderboard(selected, 100), readUUIDMap()]);
  const rows = runs.map((r) => ({ name: r.name, value: r.timeMs, stateUF: r.stateUF }));

  return (
    <div>
      <PageHeader
        title="RSG Leaderboard"
        subtitle="Ranking por categoria. Mostra apenas a melhor run (menor tempo) de cada player."
      />

      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`/leaderboards/rsg?category=${encodeURIComponent(cat)}`}
            className={
              "rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition-all " +
              (cat === selected
                ? "border-emerald-500 bg-emerald-600 text-white"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800")
            }
          >
            {cat}
          </a>
        ))}
      </div>

      <PlayerLeaderboardView
        title={`Top Jogadores (${selected})`}
        valueLabel="Tempo"
        rows={rows}
        uuidMap={uuidMap}
        formatValue={formatTimeMs}
      />
    </div>
  );
}
