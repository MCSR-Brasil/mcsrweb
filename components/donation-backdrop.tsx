import { Suspense } from "react";
import { getDvdDonors } from "../lib/donations";
import { DonationDvd } from "./donation-dvd";

async function Backdrop() {
  // Cached server-side (~8 min via the fetch revalidate in sheets-backend):
  // page renders stay fast; the /overlay/donations page still fetches fresh.
  const donors = await getDvdDonors(false);
  if (donors.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      <link rel="preconnect" href="https://mc-heads.net" />
      <link rel="preconnect" href="https://crafatar.com" />
      <link rel="preconnect" href="https://minotar.net" />
      <DonationDvd donors={donors} variant="fill" />
    </div>
  );
}

export function DonationBackdrop() {
  return (
    <Suspense fallback={null}>
      <Backdrop />
    </Suspense>
  );
}
