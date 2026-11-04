import { Suspense } from "react";
import { getDvdDonors } from "../lib/donations";
import { DonationDvd } from "./donation-dvd";

async function Backdrop() {
  const donors = await getDvdDonors();
  if (donors.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
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
