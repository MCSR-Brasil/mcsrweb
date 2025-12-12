import fs from "node:fs/promises";
import path from "node:path";
import { normalizeName } from "./normalize";

export type UUIDMap = Map<string, string>; // key: normalized name, value: uuid

export async function readUUIDMap(csvPath?: string): Promise<UUIDMap> {
  const filePath = csvPath ?? path.resolve(process.cwd(), "data", "uuid.csv");
  const map: UUIDMap = new Map();
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
    map.set(name, uuid);
  }
  return map;
}
