import { normalizeName } from "./normalize";
import { fetchAppsScriptAction } from "./sheets-backend";

export type Winner = { name: string; amount: number };
export type EventRow = {
  event: string;
  prizepool: number | null;
  date: string | null;
  info: string | null;
  winners: Winner[];
};

function parseWinners(raw: unknown): Winner[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (!Array.isArray(item)) return [];

    const name = String(item[0] ?? "").trim();
    const amount = Number(item[1]);
    return name && Number.isFinite(amount) ? [{ name, amount }] : [];
  });
}

function parseTournament(raw: unknown): EventRow | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const tournament = raw as Record<string, unknown>;
  const event = String(tournament.event ?? "").trim();
  if (!event) return null;

  const prizepoolValue = tournament.prizepool;
  const prizepool = prizepoolValue === null || prizepoolValue === "" ? null : Number(prizepoolValue);

  return {
    event,
    prizepool: Number.isFinite(prizepool) ? prizepool : null,
    date: String(tournament.date ?? "").trim() || null,
    info: String(tournament.info ?? "").trim() || null,
    winners: parseWinners(tournament.winners),
  };
}

export async function readEarnings(): Promise<EventRow[]> {
  const json = await fetchAppsScriptAction("earnings");
  const tournaments = Array.isArray(json?.tournaments) ? json.tournaments : [];
  return tournaments.flatMap((tournament) => {
    const parsed = parseTournament(tournament);
    return parsed ? [parsed] : [];
  });
}

export type Leader = { name: string; earnings: number };

export function getEarningsLeaderboard(rows: EventRow[], limit?: number): Leader[] {
  const totals = new Map<string, number>();
  const displayName = new Map<string, string>();
  for (const row of rows) {
    for (const w of row.winners) {
      if (!w.name) continue;
      const key = normalizeName(w.name);
      if (!displayName.has(key) && w.name.trim()) displayName.set(key, w.name.trim());
      totals.set(key, (totals.get(key) ?? 0) + (w.amount ?? 0));
    }
  }
  const leaders = Array.from(totals.entries())
    .map(([key, earnings]) => ({ name: displayName.get(key) ?? key, earnings }))
    .sort((a, b) => b.earnings - a.earnings);
  return typeof limit === "number" ? leaders.slice(0, limit) : leaders;
}
