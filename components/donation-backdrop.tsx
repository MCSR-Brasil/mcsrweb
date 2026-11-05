import { Suspense } from "react";
import { getDvdDonors } from "../lib/donations";
import { DonationDvd } from "./donation-dvd";

async function Backdrop() {
  // Cached server-side for 2 min: page renders stay fast, new donors still
  // show up quickly; the /overlay/donations page fetches fully fresh.
  const donors = await getDvdDonors(false, 120);
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
