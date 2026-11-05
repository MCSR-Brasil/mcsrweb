import { fetchAppsScriptAction } from "./sheets-backend";
import { normalizeName } from "./normalize";
import { readUUIDMap, type UUIDMap } from "./uuids";

export type Donation = {
  name: string;
  normalizedName: string;
  amount: number;
};

export type DvdDonor = {
  name: string;
  headUrl: string;
  headFallbacks: string[];
  amountLabel: string;
  size: number; // px, already scaled by donation curve
};

// Log curve: heads grow quickly at low donations and flatten out at the top,
// so a R$ 10 donor is still readable and a R$ 1500 donor isn't gigantic.
const MIN_SIZE = 56;
const MAX_SIZE = 150;

function headSize(amount: number, maxAmount: number): number {
  const t = Math.log(1 + Math.max(0, amount)) / Math.log(1 + Math.max(1, maxAmount));
  return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * Math.min(1, t));
}

function formatBRL(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function toDvdDonors(donations: Donation[], uuidMap: UUIDMap): DvdDonor[] {
  const maxAmount = donations[0]?.amount ?? 0;
  return donations.map((d) => {
    const uuid = uuidMap[d.normalizedName];
    const id = encodeURIComponent(uuid ?? d.name);
    return {
      name: d.name,
      headUrl: `https://mc-heads.net/avatar/${id}/100`,
      headFallbacks: [
        `https://crafatar.com/avatars/${id}?size=100&overlay`,
        `https://minotar.net/helm/${encodeURIComponent(d.name)}/100.png`,
        "https://mc-heads.net/avatar/MHF_Steve/100",
      ],
      amountLabel: formatBRL(d.amount),
      size: headSize(d.amount, maxAmount),
    };
  });
}

export async function getDvdDonors(fresh = true, revalidate?: number): Promise<DvdDonor[]> {
  const [donations, uuidMap] = await Promise.all([
    readDonations(fresh, revalidate),
    readUUIDMap(undefined, fresh, revalidate),
  ]);
  return toDvdDonors(donations, uuidMap);
}

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

export async function readDonations(fresh = false, revalidate?: number): Promise<Donation[]> {
  const json = await fetchAppsScriptAction("getdonations", { fresh, revalidate });
  if (!json) return [];

  const raw = Array.isArray(json.apoiadores)
    ? json.apoiadores
    : Array.isArray(json.donations)
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
