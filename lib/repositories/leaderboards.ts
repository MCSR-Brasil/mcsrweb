import fs from "node:fs/promises";
import path from "node:path";
import { normalizeName } from "../normalize";
import { fetchAppsScriptAction, parseTimeToMs } from "../sheets-backend";
import { normalizeStateUF } from "../states";

export type PlayerLeaderboardRow = {
  name: string;
  value: number;
  stateUF?: string | null;
  uuid?: string | null;
};

export type RunLeaderboardRow = {
  name: string;
  timeMs: number;
  stateUF?: string | null;
  category?: string;
  achievedAt?: string | null;
  link?: string | null;
  description?: string | null;
  seed?: string | null;
  bastion?: string | null;
};

const mockRuns: RunLeaderboardRow[] = [
  { name: "shy", timeMs: 512345, stateUF: "SP" },
  { name: "hange", timeMs: 520420, stateUF: "MG" },
  { name: "epnok", timeMs: 533000, stateUF: "RJ" },
  { name: "seedmaster", timeMs: 545120, stateUF: "SP" },
  { name: "fortress", timeMs: 579991, stateUF: "SP" },
];

const mockRanked: PlayerLeaderboardRow[] = [
  { name: "shy", value: 1910, stateUF: "SP" },
  { name: "hange", value: 1755, stateUF: "MG" },
  { name: "epnok", value: 1690, stateUF: "RJ" },
  { name: "netherking", value: 1588, stateUF: "SC" },
  { name: "fortress", value: 1501, stateUF: "BA" },
];

export type RunnerSourceRow = {
  name: string;
  stateUF: string | null;
  uuid: string | null;
  ranked: boolean;
};

const MCSR_RANKED_BR_API = "https://mcsrranked.com/api/leaderboard?country=BR";

function normalizeUuid(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-f0-9]/g, "");
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

async function readRunsCsv(): Promise<RunLeaderboardRow[]> {
  const filePath = path.resolve(process.cwd(), "data", "runs.csv");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [];

    const rows: RunLeaderboardRow[] = [];
    for (const line of lines.slice(1)) {
      const [name, timeMsRaw, stateUF, category, achievedAt, link, description, seed, bastion] = parseCsvLine(line);
      const timeMs = Number(timeMsRaw);
      if (!name || !Number.isFinite(timeMs) || timeMs <= 0) continue;
      rows.push({
        name,
        timeMs: Math.floor(timeMs),
        stateUF: stateUF || null,
        category: category || undefined,
        achievedAt: achievedAt || null,
        link: link || null,
        description: description || null,
        seed: seed || null,
        bastion: bastion || null,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export async function readRunnersAppsScript(fresh = false): Promise<RunnerSourceRow[]> {
  const json = await fetchAppsScriptAction("runners", { fresh });
  const runners = Array.isArray(json?.runners) ? json.runners : [];
  const rows: RunnerSourceRow[] = [];
  for (const item of runners) {
    if (!Array.isArray(item)) continue;
    const c0 = String(item[0] ?? "").trim();
    const isTimestampFirst = /^\d{10,}$/.test(c0);
    const cols = isTimestampFirst ? item.slice(1) : item;

    const name = String(cols[0] ?? "").trim();
    const stateUF = normalizeStateUF(String(cols[1] ?? ""));
    const uuid = String(cols[2] ?? "").trim() || null;
    const ranked = String(cols[3] ?? "").trim().toLowerCase() === "true";
    if (!name) continue;
    rows.push({ name, stateUF, uuid, ranked });
  }
  return rows;
}

async function readRunsAppsScript(category: string, fresh = false): Promise<RunLeaderboardRow[]> {
  const cat = category.trim().toLowerCase();
  const action = cat === "1.16 ssg" ? "ssg116" : cat === "1.16" ? "rsg116" : "";
  if (!action) return [];

  const [json, runners] = await Promise.all([
    fetchAppsScriptAction(action, { fresh }),
    readRunnersAppsScript(fresh),
  ]);
  const runs = Array.isArray(json?.runs) ? json.runs : [];
  const byName = new Map<string, RunnerSourceRow>();
  for (const r of runners) byName.set(normalizeName(r.name), r);

  const rows: RunLeaderboardRow[] = [];
  for (const item of runs) {
    if (!Array.isArray(item)) continue;
    const name = String(item[0] ?? "").trim();
    if (!name) continue;

    const timeMs = parseTimeToMs(item[1]);
    if (!Number.isFinite(timeMs) || (timeMs as number) <= 0) continue;

    const profile = byName.get(normalizeName(name));
    if (action === "rsg116") {
      rows.push({
        name,
        timeMs: Math.floor(timeMs as number),
        stateUF: profile?.stateUF ?? null,
        category: "1.16",
        achievedAt: String(item[3] ?? "").trim() || null,
        link: String(item[6] ?? "").trim() || null,
        description: String(item[7] ?? "").trim() || null,
        seed: String(item[5] ?? "").trim() || null,
        bastion: String(item[2] ?? "").trim() || null,
      });
      continue;
    }

    rows.push({
      name,
      timeMs: Math.floor(timeMs as number),
      stateUF: profile?.stateUF ?? null,
      category: "1.16 SSG",
      achievedAt: String(item[3] ?? "").trim() || null,
      link: String(item[5] ?? "").trim() || null,
      description: String(item[6] ?? "").trim() || null,
      seed: String(item[2] ?? "").trim() || null,
      bastion: null,
    });
  }
  return rows;
}

async function readRankedAppsScript(fresh = false): Promise<PlayerLeaderboardRow[]> {
  const runners = await readRunnersAppsScript(fresh);
  const byName = new Map<string, RunnerSourceRow>();
  const byUuid = new Map<string, RunnerSourceRow>();
  for (const r of runners) {
    byName.set(normalizeName(r.name), r);
    const id = normalizeUuid(r.uuid);
    if (id) byUuid.set(id, r);
  }

  try {
    const res = await fetch(MCSR_RANKED_BR_API, {
      method: "GET",
      ...(fresh ? { cache: "no-store" } : { next: { revalidate: 500 } }),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        status?: string;
        data?: { users?: Array<{ uuid?: string; nickname?: string; eloRate?: number }> };
      };
      const users = Array.isArray(json?.data?.users) ? json.data.users : [];
      if (users.length > 0) {
        const rows: PlayerLeaderboardRow[] = [];
        for (const user of users) {
          const nickname = String(user?.nickname ?? "").trim();
          const elo = Number(user?.eloRate ?? NaN);
          if (!nickname || !Number.isFinite(elo)) continue;

          const profileByUuid = byUuid.get(normalizeUuid(String(user?.uuid ?? "")));
          const profileByName = byName.get(normalizeName(nickname));
          const profile = profileByUuid ?? profileByName;

          rows.push({
            name: nickname,
            value: Math.floor(elo),
            stateUF: profile?.stateUF ?? null,
            uuid: normalizeUuid(String(user?.uuid ?? "")) || null,
          });
        }
        if (rows.length > 0) return rows;
      }
    }
  } catch {
    // fallback below
  }

  const json = await fetchAppsScriptAction("ranked", { fresh });
  const rankedRaw = Array.isArray(json?.ranked) ? json.ranked : Array.isArray(json?.runs) ? json.runs : [];
  if (!Array.isArray(rankedRaw) || rankedRaw.length === 0) return [];

  const rows: PlayerLeaderboardRow[] = [];
  for (const item of rankedRaw) {
    if (!Array.isArray(item)) continue;
    const name = String(item[0] ?? "").trim();
    const value = Number(item[1] ?? NaN);
    if (!name || !Number.isFinite(value)) continue;
    const stateFromRow = normalizeStateUF(String(item[2] ?? ""));
    const stateFromRunner = byName.get(normalizeName(name))?.stateUF ?? null;
    rows.push({
      name,
      value: Math.floor(value),
      stateUF: stateFromRow || stateFromRunner,
      uuid: byName.get(normalizeName(name))?.uuid ?? null,
    });
  }
  return rows;
}

async function readRankedCsv(): Promise<PlayerLeaderboardRow[]> {
  const filePath = path.resolve(process.cwd(), "data", "ranked.csv");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return [];

    const rows: PlayerLeaderboardRow[] = [];
    for (const line of lines.slice(1)) {
      const [name, valueRaw, stateUF, uuid] = parseCsvLine(line);
      const value = Number(valueRaw);
      if (!name || !Number.isFinite(value)) continue;
      rows.push({
        name,
        value: Math.floor(value),
        stateUF: normalizeStateUF(stateUF),
        uuid: normalizeUuid(uuid) || null,
      });
    }
    return rows;
  } catch {
    return [];
  }
}

export async function getRsgLeaderboard(limit = 100): Promise<PlayerLeaderboardRow[]> {
  const rows = await getRunsLeaderboard("1.16", 1000);
  const bestByName = new Map<string, RunLeaderboardRow>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const prev = bestByName.get(key);
    if (!prev || row.timeMs < prev.timeMs) bestByName.set(key, row);
  }
  return Array.from(bestByName.values())
    .sort((a, b) => a.timeMs - b.timeMs)
    .slice(0, limit)
    .map((r) => ({ name: r.name, value: r.timeMs, stateUF: r.stateUF ?? null }));
}

export async function getRunsLeaderboard(category: string, limit = 100, fresh = false): Promise<RunLeaderboardRow[]> {
  const cat = category.trim().toLowerCase();
  const backendRows = await readRunsAppsScript(category, fresh);
  const rows = backendRows.length > 0 ? backendRows : await readRunsCsv();
  const source = rows.length > 0 ? rows : mockRuns;
  const filtered = source.filter((r) => String(r.category ?? "1.16").trim().toLowerCase() === cat);
  return filtered.sort((a, b) => a.timeMs - b.timeMs).slice(0, limit);
}

export async function getRankedLeaderboard(limit = 100, fresh = false): Promise<PlayerLeaderboardRow[]> {
  const backendRows = await readRankedAppsScript(fresh);
  const rows = backendRows.length > 0 ? backendRows : await readRankedCsv();
  const source = rows.length > 0 ? rows : mockRanked;
  return source.slice().sort((a, b) => b.value - a.value).slice(0, limit);
}
