"use client";

import { useState } from "react";
import { StateBadge } from "./state-badge";

export function StateFlag({ uf, className }: { uf: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const code = uf.trim().toUpperCase();
  if (!code) return null;

  if (failed) return <StateBadge uf={code} />;

  return (
    <span className="inline-flex items-center">
      <img
        src={`/states/${code.toLowerCase()}.png`}
        alt={`${code} flag`}
        className={
          className ??
          "h-5 w-7 rounded-sm border border-zinc-200 object-cover shadow-sm dark:border-zinc-700"
        }
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </span>
  );
}
