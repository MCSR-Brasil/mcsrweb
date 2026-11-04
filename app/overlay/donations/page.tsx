import type { Metadata } from "next";
import { getDvdDonors, toDvdDonors } from "../../../lib/donations";
import { readUUIDMap } from "../../../lib/uuids";
import { DonationDvd } from "../../../components/donation-dvd";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donations Overlay",
  robots: { index: false, follow: false },
};

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

  const donors =
    "demo" in params
      ? toDvdDonors(
          DEMO_DONATIONS.map((d) => ({
            ...d,
            normalizedName: d.name.toLowerCase(),
          })),
          await readUUIDMap()
        )
      : await getDvdDonors();

  return <DonationDvd donors={donors} />;
}
