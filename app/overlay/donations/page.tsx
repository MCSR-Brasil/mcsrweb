import type { Metadata } from "next";
import { readDonations } from "../../../lib/donations";
import { readUUIDMap } from "../../../lib/uuids";
import { DonationDvd, type DvdDonor } from "../../../components/donation-dvd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donations Overlay",
  robots: { index: false, follow: false },
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

const DEMO_DONATIONS = [
  { name: "epik", amount: 1500 },
  { name: "booster", amount: 440 },
  { name: "sanjinhu", amount: 220 },
  { name: "shy", amount: 90 },
  { name: "ferrer", amount: 30 },
  { name: "darkk", amount: 10 },
];

export default async function DonationsOverlayPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const demo = "demo" in params;

  const [donations, uuidMap] = demo
    ? [
        DEMO_DONATIONS.map((d) => ({
          ...d,
          normalizedName: d.name.toLowerCase(),
        })),
        await readUUIDMap(),
      ]
    : await Promise.all([readDonations(true), readUUIDMap(undefined, true)]);

  const maxAmount = donations[0]?.amount ?? 0;

  const donors: DvdDonor[] = donations.map((d) => {
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

  return <DonationDvd donors={donors} />;
}
