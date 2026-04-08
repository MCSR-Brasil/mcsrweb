import { getAction, getBackendConfig } from "./backend-config";

type AppsScriptResponse = Record<string, unknown>;

function normalizeText(v: unknown): string {
  return String(v ?? "").trim();
}

export function parseTimeToMs(raw: unknown): number | null {
  const s = normalizeText(raw);
  if (!s) return null;

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }

  const m = s.match(/^(\d{1,2}):(\d{2})(?:[\.:](\d{1,3}))?$/);
  if (!m) return null;
  const minutes = Number(m[1]);
  const seconds = Number(m[2]);
  const millisRaw = m[3] ? m[3].padEnd(3, "0") : "000";
  const millis = Number(millisRaw);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || !Number.isFinite(millis)) return null;
  return minutes * 60_000 + seconds * 1_000 + millis;
}

async function fetchJson(url: string): Promise<AppsScriptResponse | null> {
  try {
    const res = await fetch(url, { method: "GET", next: { revalidate: 500 } });
    if (!res.ok) return null;
    const json = (await res.json()) as AppsScriptResponse;
    return json;
  } catch {
    return null;
  }
}

export async function fetchAppsScriptAction(actionName: string): Promise<AppsScriptResponse | null> {
  const cfg = getBackendConfig();
  const baseUrl = normalizeText(cfg.appsScript.baseUrl);
  if (!baseUrl) return null;
  const action = getAction(actionName) || actionName;
  if (!action) return null;

  const url = new URL(baseUrl);
  url.searchParams.set("action", action);
  return fetchJson(url.toString());
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

export async function fetchSheetRangeCsv(sheetId: string, range: string, sheetName?: string): Promise<string[][]> {
  const cleanId = normalizeText(sheetId);
  if (!cleanId) return [];

  try {
    const url = new URL(`https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq`);
    url.searchParams.set("tqx", "out:csv");
    url.searchParams.set("range", range);
    if (sheetName && normalizeText(sheetName)) {
      url.searchParams.set("sheet", normalizeText(sheetName));
    }

    const res = await fetch(url.toString(), { method: "GET", next: { revalidate: 500 } });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    return lines.map((l) => parseCsvLine(l));
  } catch {
    return [];
  }
}
