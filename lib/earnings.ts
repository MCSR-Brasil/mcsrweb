import fs from "node:fs/promises";
import path from "node:path";
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

function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // Toggle quotes, handle escaped quotes "" inside
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++; // skip next
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function parseWinners(cell: string | undefined): Winner[] {
  if (!cell) return [];
  // Examples: "shy 487|epnok 185|hange 75"
  return cell
    .split("|")
    .map(seg => seg.trim())
    .filter(Boolean)
    .map(seg => {
      const parts = seg.split(/\s+/);
      const maybeAmount = parts.pop();
      const amount = maybeAmount ? Number(maybeAmount.replace(/[^0-9.\-]/g, "")) : NaN;
      const name = parts.join(" ");
      return {
        name: name || "Unknown",
        amount: Number.isFinite(amount) ? amount : 0,
      } as Winner;
    })
    .filter(w => w.amount >= 0);
}

function parseWinnersUnknown(raw: unknown): Winner[] {
  if (Array.isArray(raw)) {
    const rows: Winner[] = [];
    for (const item of raw) {
      if (Array.isArray(item)) {
        const name = String(item[0] ?? "").trim();
        const amount = Number(item[1] ?? NaN);
        if (name && Number.isFinite(amount)) rows.push({ name, amount });
        continue;
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const name = String(obj.name ?? "").trim();
        const amount = Number(obj.amount ?? NaN);
        if (name && Number.isFinite(amount)) rows.push({ name, amount });
      }
    }
    return rows;
  }
  return parseWinners(String(raw ?? ""));
}

async function readEarningsAppsScript(): Promise<EventRow[]> {
  const json = await fetchAppsScriptAction("earnings");
  const eventsRaw = Array.isArray(json?.events) ? json.events : Array.isArray(json?.rows) ? json.rows : [];
  if (!Array.isArray(eventsRaw) || eventsRaw.length === 0) return [];

  const rows: EventRow[] = [];
  for (const item of eventsRaw) {
    if (!Array.isArray(item)) continue;
    const event = String(item[0] ?? "").trim();
    if (!event) continue;

    const prizepool = Number(String(item[1] ?? "").replace(/[^0-9.\-]/g, ""));
    rows.push({
      event,
      prizepool: Number.isFinite(prizepool) ? prizepool : null,
      date: String(item[2] ?? "").trim() || null,
      info: String(item[3] ?? "").trim() || null,
      winners: parseWinnersUnknown(item[4]),
    });
  }
  return rows;
}

export async function readEarningsCSV(csvPath?: string): Promise<EventRow[]> {
  const backendRows = await readEarningsAppsScript();
  if (backendRows.length > 0) return backendRows;

  const filePath = csvPath ?? path.resolve(process.cwd(), "data", "earnings.csv");
  const raw = await fs.readFile(filePath, "utf8");
  const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Skip header if present
  const header = splitCSVLine(lines[0]).map(h => h.toLowerCase());
  const startIndex = header.includes("event") ? 1 : 0;

  const rows: EventRow[] = [];
  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    // Expected columns: Event, Prizepool, Date, Info, Winners
    const [event, prizepoolStr, date, info, winnersCell] = [
      cols[0] ?? "",
      cols[1] ?? "",
      cols[2] ?? "",
      cols[3] ?? "",
      cols[4] ?? "",
    ];

    const prizepool = prizepoolStr ? Number(prizepoolStr.replace(/[^0-9.\-]/g, "")) : null;

    rows.push({
      event: event?.trim() || "",
      prizepool: Number.isFinite(prizepool as number) ? (prizepool as number) : null,
      date: date?.trim() || null,
      info: info?.trim() || null,
      winners: parseWinners(winnersCell),
    });
  }
  return rows;
}

export type Leader = { name: string; earnings: number };

export async function getLeaderboardFromCSV(limit?: number): Promise<Leader[]> {
  const rows = await readEarningsCSV();
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
