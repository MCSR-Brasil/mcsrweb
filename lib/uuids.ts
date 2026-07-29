import fs from "node:fs/promises";
import path from "node:path";
import { normalizeName } from "./normalize";
import { fetchAppsScriptAction } from "./sheets-backend";

export type UUIDMap = Record<string, string>; // key: normalized name, value: uuid

async function readUUIDMapFromAppsScript(fresh = false): Promise<UUIDMap> {
  const map: UUIDMap = {};
  const json = await fetchAppsScriptAction("runners", { fresh });
  const runners = Array.isArray(json?.runners) ? json.runners : [];
  for (const item of runners) {
    if (!Array.isArray(item)) continue;
    const c0 = String(item[0] ?? "").trim();
    const isTimestampFirst = /^\d{10,}$/.test(c0);
    const cols = isTimestampFirst ? item.slice(1) : item;

    const name = normalizeName(String(cols[0] ?? ""));
    const uuid = String(cols[2] ?? "").trim();
    if (!name || !uuid) continue;
    map[name] = uuid;
  }
  return map;
}

export async function readUUIDMap(csvPath?: string, fresh = false): Promise<UUIDMap> {
  const backendMap = await readUUIDMapFromAppsScript(fresh);
  if (Object.keys(backendMap).length > 0) return backendMap;

  const filePath = csvPath ?? path.resolve(process.cwd(), "data", "uuid.csv");
  const map: UUIDMap = {};
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return map; // file optional for now
  }
  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === ".") continue;
    const idx = trimmed.indexOf(",");
    if (idx === -1) continue;
    const name = normalizeName(trimmed.slice(0, idx));
    const uuid = trimmed.slice(idx + 1).trim();
    if (!name || !uuid) continue;
    map[name] = uuid;
  }
  return map;
}
