"use client";

import { useBackgroundRefresh } from "../hooks/use-background-refresh";
import type { EventRow, Leader } from "../lib/earnings";
import type { UUIDMap } from "../lib/uuids";
import { PageHeader } from "./page-header";
import { TabContent } from "./tab-content";

type EarningsData = {
  events: EventRow[];
  leaders: Leader[];
  uuidMap: UUIDMap;
  totalFormatted: string;
};

export function EarningsRefreshClient({ initial }: { initial: EarningsData }) {
  const { data } = useBackgroundRefresh<EarningsData>(initial, "/api/earnings", {
    refreshIntervalMs: 300_000,
  });

  return (
    <div>
      <PageHeader
        title="Ganhos de Torneios"
        subtitle="Eventos de membros/aniversario nao sao considerados para ganhos individuais."
      />
      <TabContent
        leaders={data.leaders}
        uuidMap={data.uuidMap}
        events={data.events}
        totalFormatted={data.totalFormatted}
      />
    </div>
  );
}
