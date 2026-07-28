"use client";

import { useEffect, useMemo, useRef } from "react";
import type { StateLeaderboardRow } from "../lib/repositories/states";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_brazilLow from "@amcharts/amcharts5-geodata/brazilLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import type { GeoJSON } from "geojson";

type PolygonDataContext = {
  value?: unknown;
  uf?: unknown;
  name?: unknown;
};

type PolygonDataItemLike = {
  get?: (key: string) => unknown;
  dataContext?: PolygonDataContext;
};

function getContext(target: { dataItem?: unknown }): PolygonDataContext {
  const item = target.dataItem as PolygonDataItemLike | undefined;
  const fromGet = item?.get?.("value");
  const context = item?.dataContext ?? {};
  if (fromGet !== undefined) return { ...context, value: fromGet };
  return context;
}

export function StateMap({
  rows,
  selectedUF,
  onSelect,
  className,
}: {
  rows: StateLeaderboardRow[];
  selectedUF?: string;
  onSelect?: (uf: string, name: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const polygonSeriesRef = useRef<am5map.MapPolygonSeries | null>(null);
  const maxValueRef = useRef<number>(1);
  const onSelectRef = useRef<typeof onSelect>(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const mapData = useMemo(
    () => rows.map((r) => ({ id: r.amchartsId, value: r.value, uf: r.uf, name: r.name })),
    [rows]
  );

  const maxValue = useMemo(() => Math.max(1, ...rows.map((r) => r.value)), [rows]);

  useEffect(() => {
    if (!ref.current) return;

    const root = am5.Root.new(ref.current);
    rootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "translateX",
        panY: "translateY",
        wheelX: "none",
        wheelY: "zoom",
        pinchZoom: true,
        projection: am5map.geoMercator(),
      })
    );

    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_brazilLow as GeoJSON,
        valueField: "value",
        calculateAggregates: true,
      })
    );
    polygonSeriesRef.current = polygonSeries;

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}\n{value} jogador(es)",
      interactive: true,
      fillOpacity: 0.95,
      stroke: am5.color(0xffffff),
      strokeWidth: 2.5,
      strokeOpacity: 0.95,
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
      stroke: am5.color(0x10b981),
      strokeWidth: 3.5,
      strokeOpacity: 1,
    });

    polygonSeries.mapPolygons.template.states.create("active", {
      stroke: am5.color(0xf59e0b),
      strokeWidth: 3.5,
      strokeOpacity: 1,
    });

    polygonSeries.mapPolygons.template.adapters.add("fill", (_fill, target) => {
      const v = Number(getContext(target).value ?? 0);
      return am5.color(colorForValue(v, maxValueRef.current));
    });

    polygonSeries.mapPolygons.template.adapters.add("fillOpacity", (op, target) => {
      const v = Number(getContext(target).value ?? 0);
      if (!Number.isFinite(v) || v <= 0) return 0.35;
      return op;
    });

    polygonSeries.mapPolygons.template.events.on("click", (ev) => {
      const dc = getContext(ev.target);
      const uf = typeof dc?.uf === "string" ? dc.uf : "";
      const name = typeof dc?.name === "string" ? dc.name : uf;
      if (!uf) return;
      polygonSeries.mapPolygons.each((p) => p.set("active", false));
      ev.target.set("active", true);
      onSelectRef.current?.(uf, name);
    });

    return () => {
      polygonSeriesRef.current = null;
      rootRef.current = null;
      root.dispose();
    };
  }, []);

  useEffect(() => {
    polygonSeriesRef.current?.data.setAll(mapData);
    maxValueRef.current = maxValue;
  }, [mapData, maxValue]);

  useEffect(() => {
    const polygonSeries = polygonSeriesRef.current;
    if (!polygonSeries || !selectedUF) return;
    const desired = String(selectedUF).toUpperCase();
    polygonSeries.mapPolygons.each((p) => {
      const dc = getContext(p);
      const uf = typeof dc?.uf === "string" ? dc.uf.toUpperCase() : "";
      p.set("active", uf === desired);
    });
  }, [selectedUF]);

  return (
    <div
      ref={ref}
      className={
        className ??
        "h-full min-h-[520px] w-full rounded-2xl border border-zinc-200 bg-white/70 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/50"
      }
    />
  );
}

function colorForValue(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0x0f172a;
  const safeMax = Math.max(1, max);
  const t = safeMax === 1 ? 1 : Math.min(1, Math.sqrt((value - 1) / (safeMax - 1)));

  const palette = [
    { t: 0.0, rgb: [59, 130, 246] }, // blue-500
    { t: 0.25, rgb: [109, 252, 81] }, // mcsr green
    { t: 0.45, rgb: [250, 204, 21] }, // yellow-400
    { t: 0.65, rgb: [249, 115, 22] }, // orange-500
    { t: 0.85, rgb: [239, 68, 68] }, // red-500
    { t: 1.0, rgb: [168, 85, 247] }, // purple-500
  ];

  let lower = palette[0];
  let upper = palette[palette.length - 1];
  for (let i = 0; i < palette.length - 1; i++) {
    if (t >= palette[i].t && t <= palette[i + 1].t) {
      lower = palette[i];
      upper = palette[i + 1];
      break;
    }
  }

  const range = upper.t - lower.t || 1;
  const localT = (t - lower.t) / range;
  const [r, g, b] = lower.rgb.map((c, i) => Math.round(c + (upper.rgb[i] - c) * localT));
  return (r << 16) | (g << 8) | b;
}
