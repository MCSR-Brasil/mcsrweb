import { getTournamentConfigEntries, getTournamentDefaultType, type BackendPageType } from "../backend-config";

export type TournamentCard = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  url?: string;
  prizePool?: string;
  startsAt?: string;
};

export type TournamentPageData = {
  slug: string;
  cardTitle: string;
  cardSubtitle: string;
  cardDescription: string;
  prizePool?: string;
  startsAt?: string;
  pageType: BackendPageType;
  rankingLabel: string;
  url?: string;
  content: {
    title: string | null;
    description: string | null;
    links: { label: string; href: string }[];
    results: { uuid: string | null; name: string | null; prize: string | null }[];
    boards?: TournamentSsgBoard[];
    ssgScoreboard?: TournamentSsgScoreRow[];
    seeds?: string[];
  };
};

export type TournamentSsgResult = {
  name: string | null;
  verified: boolean | null;
  time: string | null;
  vodUrl?: string | null;
};

export type TournamentSsgBoard = {
  key: string;
  label: string;
  results: TournamentSsgResult[];
};

export type TournamentSsgScoreRow = {
  name: string;
  points: number;
};

type RawSsgRun = {
  name: string | null;
  verified: boolean | null;
  time: string | null;
  timeMs: number;
  boardLabel: string | null;
  vodUrl: string | null;
};

type SeedDescriptor = {
  key: string;
  label: string;
  seedValue: string;
  normalizedSeedValue: string;
  normalizedLabel: string;
};

function sanitizePageType(v: string): BackendPageType {
  const type = String(v ?? "").trim().toLowerCase();
  if (type === "default" || type === "event" || type === "custom" || type === "ranking" || type === "ssg") return type;
  return "default";
}

function sanitizeSeeds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0)
    .slice(0, 7);
}

type DefaultTournamentSheetData = {
  title: string | null;
  description: string | null;
  links: { label: string; href: string }[];
  results: { uuid: string | null; name: string | null; prize: string | null }[];
};

type SsgTournamentSheetData = {
  title: string | null;
  description: string | null;
  links: { label: string; href: string }[];
  boards: TournamentSsgBoard[];
  scoreboard: TournamentSsgScoreRow[];
};

const SSG_POINTS_BY_PLACE = [100, 80, 60, 40, 35, 30, 25, 20, 15, 10] as const;

function normalizeRunnerName(input: string | null): string {
  return String(input ?? "").trim().toLowerCase();
}

function normalizeSeedToken(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function extractSeedValue(input: string): string | null {
  const text = String(input ?? "").trim();
  if (!text) return null;

  const paren = text.match(/\((-?\d+)\)/);
  if (paren) return paren[1];

  const direct = text.match(/^-?\d+$/);
  if (direct) return direct[0];

  const anyNumber = text.match(/-?\d{6,}/);
  if (anyNumber) return anyNumber[0];

  return null;
}

function extractSeedIndex(input: string): number | null {
  const text = String(input ?? "").trim();
  if (!text) return null;
  const match = text.match(/^seed\s*(\d+)/i);
  if (!match) return null;
  const parsed = Number(match[1]);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed - 1;
}

function buildSeedDescriptors(seeds: string[]): SeedDescriptor[] {
  return seeds.map((seed, idx) => {
    const seedValue = String(seed ?? "").trim();
    const normalizedSeedValue = normalizeSeedToken(extractSeedValue(seedValue) ?? seedValue);
    const label = `Seed ${idx + 1}`;
    return {
      key: `seed-${idx + 1}`,
      label,
      seedValue,
      normalizedSeedValue,
      normalizedLabel: normalizeSeedToken(label),
    };
  });
}

function resolveSeedIndex(boardLabel: string | null, seeds: SeedDescriptor[]): number | null {
  const raw = String(boardLabel ?? "").trim();
  if (!raw || seeds.length === 0) return null;

  const fromLabelIndex = extractSeedIndex(raw);
  if (fromLabelIndex !== null && fromLabelIndex >= 0 && fromLabelIndex < seeds.length) return fromLabelIndex;

  const normalized = normalizeSeedToken(raw);
  const byLabel = seeds.findIndex((seed) => seed.normalizedLabel === normalized);
  if (byLabel >= 0) return byLabel;

  const value = normalizeSeedToken(extractSeedValue(raw) ?? raw);
  const byValue = seeds.findIndex((seed) => seed.normalizedSeedValue === value || normalizeSeedToken(seed.seedValue) === value);
  if (byValue >= 0) return byValue;

  return null;
}

function slugifyBoardKey(input: string, fallbackIndex: number): string {
  const base = String(input ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `board-${fallbackIndex + 1}`;
}

function parseTimeToMs(raw: string | null): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const withMillis = text.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/);
  if (withMillis) {
    const mm = Number(withMillis[1]);
    const ss = Number(withMillis[2]);
    const ms = Number(withMillis[3].padEnd(3, "0"));
    if (!Number.isFinite(mm) || !Number.isFinite(ss) || !Number.isFinite(ms)) return null;
    return mm * 60_000 + ss * 1_000 + ms;
  }

  const basic = text.match(/^(\d{1,2}):(\d{2})$/);
  if (basic) {
    const mm = Number(basic[1]);
    const ss = Number(basic[2]);
    if (!Number.isFinite(mm) || !Number.isFinite(ss)) return null;
    return mm * 60_000 + ss * 1_000;
  }

  return null;
}

function parseMarkdownLink(raw: string): { label: string; href: string } | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const md = text.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/i);
  if (md) return { label: md[1].trim(), href: md[2].trim() };

  const looseMd = text.match(/^\[?(.+?)\]?\((https?:\/\/[^)\s]+)\)?$/i);
  if (looseMd) return { label: looseMd[1].trim(), href: looseMd[2].trim() };

  if (/^https?:\/\//i.test(text)) return { label: text, href: text };
  return null;
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

function rowsFromUnknown(raw: unknown): string[][] {
  const asRows = Array.isArray(raw) ? raw : [];
  const rows: string[][] = [];
  for (const row of asRows) {
    if (!Array.isArray(row)) continue;
    rows.push(row.map((cell) => String(cell ?? "")));
  }
  return rows;
}

async function fetchRowsFromUrl(sourceUrl?: string): Promise<string[][]> {
  const url = String(sourceUrl ?? "").trim();
  if (!url) return [];

  try {
    const res = await fetch(url, { method: "GET", next: { revalidate: 500 } });
    if (!res.ok) return [];
    const contentType = String(res.headers.get("content-type") ?? "").toLowerCase();

    if (contentType.includes("application/json")) {
      const json = (await res.json()) as Record<string, unknown>;
      const candidate = json.rows ?? json.values ?? json.data ?? json.runs;
      return rowsFromUnknown(candidate);
    }

    const text = await res.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((l) => parseCsvLine(l));
  } catch {
    return [];
  }
}

async function readDefaultSheetData(sourceUrl?: string): Promise<DefaultTournamentSheetData> {
  if (!sourceUrl) return { title: null, description: null, links: [], results: [] };

  const rows = await fetchRowsFromUrl(sourceUrl);
  if (rows.length === 0) return { title: null, description: null, links: [], results: [] };

  const title = String(rows[0]?.[0] ?? "").trim() || null;
  const description = String(rows[1]?.[0] ?? "").trim() || null;
  const links = [String(rows[2]?.[0] ?? ""), String(rows[3]?.[0] ?? "")]
    .map((v) => parseMarkdownLink(v))
    .filter((v): v is { label: string; href: string } => Boolean(v));

  const results: { uuid: string | null; name: string | null; prize: string | null }[] = [];
  for (const row of rows.slice(4)) {
    const name = String(row?.[0] ?? "").trim() || null;
    const uuid = String(row?.[1] ?? "").trim() || null;
    const prize = String(row?.[2] ?? "").trim() || null;
    if (!uuid && !name && !prize) continue;
    results.push({ uuid, name, prize });
  }

  return {
    title,
    description,
    links,
    results,
  };
}

function parseVerified(raw: string): boolean | null {
  const value = String(raw ?? "").trim().toLowerCase();
  if (!value) return null;
  if (["sim", "yes", "true", "1", "verified", "verificado"].includes(value)) return true;
  if (["nao", "não", "no", "false", "0", "unverified", "nao verificado", "não verificado"].includes(value)) return false;
  return null;
}

async function readSsgSheetData(sourceUrl?: string, configuredSeeds: string[] = []): Promise<SsgTournamentSheetData> {
  if (!sourceUrl) return { title: null, description: null, links: [], boards: [], scoreboard: [] };

  const rows = await fetchRowsFromUrl(sourceUrl);
  if (rows.length === 0) return { title: null, description: null, links: [], boards: [], scoreboard: [] };

  const title = String(rows[0]?.[0] ?? "").trim() || null;
  const description = String(rows[1]?.[0] ?? "").trim() || null;
  const links = [String(rows[2]?.[0] ?? ""), String(rows[3]?.[0] ?? "")]
    .map((v) => parseMarkdownLink(v))
    .filter((v): v is { label: string; href: string } => Boolean(v));

  const seedDescriptors = buildSeedDescriptors(configuredSeeds);
  const runs: RawSsgRun[] = [];
  for (const row of rows.slice(5)) {
    const name = String(row?.[0] ?? "").trim() || null;
    const verified = parseVerified(String(row?.[1] ?? ""));
    const time = String(row?.[2] ?? "").trim() || null;
    const timeMs = parseTimeToMs(time) ?? Number.POSITIVE_INFINITY;
    const boardLabel = String(row?.[3] ?? "").trim() || null;
    const vodUrl = String(row?.[4] ?? "").trim() || null;
    if (!name && verified === null && !time && !boardLabel) continue;
    if (!boardLabel || !name || !time) continue;
    runs.push({ name, verified, time, timeMs, boardLabel, vodUrl });
  }

  let boards: TournamentSsgBoard[];
  if (seedDescriptors.length > 0) {
    const groupedBySeedIndex = new Map<number, RawSsgRun[]>();
    for (const run of runs) {
      const seedIndex = resolveSeedIndex(run.boardLabel, seedDescriptors);
      if (seedIndex === null) continue;
      if (!groupedBySeedIndex.has(seedIndex)) groupedBySeedIndex.set(seedIndex, []);
      groupedBySeedIndex.get(seedIndex)?.push(run);
    }

    boards = seedDescriptors.map((seed, seedIndex) => {
      const boardRuns = groupedBySeedIndex.get(seedIndex) ?? [];
      const fastestByRunner = new Map<string, RawSsgRun>();
      for (const run of boardRuns) {
        const key = normalizeRunnerName(run.name);
        if (!key) continue;

        const current = fastestByRunner.get(key);
        if (!current) {
          fastestByRunner.set(key, run);
        }
      }

      const results = Array.from(fastestByRunner.values()).map((item): TournamentSsgResult => ({
        name: item.name,
        verified: item.verified,
        time: item.time,
        vodUrl: item.vodUrl,
      }));

      return {
        key: seed.key,
        label: seed.label,
        results,
      };
    }).filter((board) => board.results.length > 0);
  } else {
    const grouped = new Map<string, RawSsgRun[]>();
    for (const run of runs) {
      const label = String(run.boardLabel ?? "").trim();
      if (!label) continue;
      if (!grouped.has(label)) grouped.set(label, []);
      grouped.get(label)?.push(run);
    }

    boards = Array.from(grouped.entries()).map(([label, boardRuns], idx) => {
      const fastestByRunner = new Map<string, RawSsgRun>();
      for (const run of boardRuns) {
        const key = normalizeRunnerName(run.name);
        if (!key) continue;

        const current = fastestByRunner.get(key);
        if (!current) {
          fastestByRunner.set(key, run);
        }
      }

      const results = Array.from(fastestByRunner.values()).map((item): TournamentSsgResult => ({
        name: item.name,
        verified: item.verified,
        time: item.time,
        vodUrl: item.vodUrl,
      }));

      return {
        key: slugifyBoardKey(label, idx),
        label,
        results,
      };
    });
  }

  const scoreboardMap = new Map<string, TournamentSsgScoreRow>();
  for (const board of boards) {
    board.results.slice(0, SSG_POINTS_BY_PLACE.length).forEach((row, index) => {
      const key = normalizeRunnerName(row.name);
      if (!key) return;
      const points = SSG_POINTS_BY_PLACE[index] ?? 0;
      const current = scoreboardMap.get(key);
      if (!current) {
        scoreboardMap.set(key, {
          name: String(row.name ?? "").trim(),
          points,
        });
        return;
      }

      current.points += points;
      if (!current.name) current.name = String(row.name ?? "").trim();
    });
  }

  const scoreboard = Array.from(scoreboardMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return {
    title,
    description,
    links,
    boards,
    scoreboard,
  };
}

export async function getTournamentCards(): Promise<TournamentCard[]> {
  const entries = getTournamentConfigEntries();
  return entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    description: entry.description,
    url: entry.url,
    prizePool: entry.prizePool,
    startsAt: entry.startsAt,
  }));
}

export async function getTournamentPageData(slug: string): Promise<TournamentPageData | null> {
  const key = String(slug ?? "").trim().toLowerCase();
  if (!key) return null;

  const entries = getTournamentConfigEntries();
  const entry = entries.find((e) => String(e.slug).trim().toLowerCase() === key);
  if (!entry) return null;

  const pageType = sanitizePageType(entry.pageType ?? getTournamentDefaultType());
  const seeds = sanitizeSeeds(entry.seeds);
  const defaultHdr = pageType === "ssg" ? null : await readDefaultSheetData(entry.url);
  const ssgHdr = pageType === "ssg" ? await readSsgSheetData(entry.url, seeds) : null;
  const firstBoardResults = (ssgHdr?.boards[0]?.results ?? []).map((item: TournamentSsgResult) => ({
    uuid: null,
    name: item.name,
    prize: item.time,
  }));

  return {
    slug: entry.slug,
    cardTitle: entry.title,
    cardSubtitle: entry.subtitle,
    cardDescription: entry.description,
    prizePool: entry.prizePool,
    startsAt: entry.startsAt,
    pageType,
    rankingLabel: pageType === "event" ? "Evento" : pageType === "custom" ? "Custom" : pageType === "ssg" ? "SSG" : "Ranking",
    url: entry.url,
    content: {
      title: ssgHdr?.title ?? defaultHdr?.title ?? null,
      description: ssgHdr?.description ?? defaultHdr?.description ?? null,
      links: ssgHdr?.links ?? defaultHdr?.links ?? [],
      results: ssgHdr ? firstBoardResults : (defaultHdr?.results ?? []),
      boards: ssgHdr?.boards,
      ssgScoreboard: ssgHdr?.scoreboard,
      seeds,
    },
  };
}
