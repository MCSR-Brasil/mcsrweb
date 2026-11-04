import { fetchAppsScriptAction } from "./sheets-backend";
import { normalizeName } from "./normalize";

export type Donation = {
  name: string;
  normalizedName: string;
  amount: number;
};

function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const s = String(raw ?? "").replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDonationItem(item: unknown): Donation | null {
  if (Array.isArray(item)) {
    const name = String(item[0] ?? "").trim();
    const amount = parseAmount(item[1]);
    if (!name || amount == null) return null;
    return { name, normalizedName: normalizeName(name), amount };
  }
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    const name = String(obj.name ?? obj.player ?? obj.donor ?? "").trim();
    const amount = parseAmount(obj.value ?? obj.amount ?? obj.donation);
    if (!name || amount == null) return null;
    return { name, normalizedName: normalizeName(name), amount };
  }
  return null;
}

export async function readDonations(fresh = false): Promise<Donation[]> {
  const json = await fetchAppsScriptAction("getdonations", { fresh });
  if (!json) return [];

  const raw = Array.isArray(json.donations)
    ? json.donations
    : Array.isArray(json.data)
      ? json.data
      : [];

  const byName = new Map<string, Donation>();
  for (const item of raw) {
    const d = parseDonationItem(item);
    if (!d) continue;
    const existing = byName.get(d.normalizedName);
    if (existing) existing.amount += d.amount;
    else byName.set(d.normalizedName, { ...d });
  }

  return Array.from(byName.values()).sort((a, b) => b.amount - a.amount);
}
