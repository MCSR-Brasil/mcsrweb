"use client";

import { useEffect, useMemo, useRef } from "react";
import type { StateLeaderboardRow } from "../lib/repositories/states";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_brazilLow from "@amcharts/amcharts5-geodata/brazilLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";

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
  const onSelectRef = useRef<typeof onSelect>(onSelect);

  onSelectRef.current = onSelect;

  const mapData = useMemo(
    () => rows.map((r) => ({ id: r.amchartsId, value: r.value, uf: r.uf, name: r.name })),
    [rows]
  );

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
        geoJSON: am5geodata_brazilLow as any,
        valueField: "value",
        calculateAggregates: true,
      })
    );
    polygonSeriesRef.current = polygonSeries;

    polygonSeries.mapPolygons.template.setAll({
      tooltipText: "{name}: {value}",
      interactive: true,
      fillOpacity: 0.95,
      stroke: am5.color(0xffffff),
      strokeWidth: 1.2,
      strokeOpacity: 0.9,
    });

    polygonSeries.mapPolygons.template.states.create("active", {
      stroke: am5.color(0xf59e0b),
      strokeWidth: 2,
      strokeOpacity: 1,
    });

    polygonSeries.set("heatRules", [
      {
        target: polygonSeries.mapPolygons.template,
        dataField: "value",
        // Blue -> Purple -> Pink-ish style heatmap
        min: am5.color(0x1d4ed8),
        max: am5.color(0xf43f5e),
        key: "fill",
      },
    ]);

    polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
      const v = Number((target.dataItem as any)?.get?.("value") ?? (target.dataItem as any)?.dataContext?.value ?? 0);
      if (!Number.isFinite(v) || v <= 0) return am5.color(0x0f172a);
      return fill;
    });

    polygonSeries.mapPolygons.template.adapters.add("fillOpacity", (op, target) => {
      const v = Number((target.dataItem as any)?.get?.("value") ?? (target.dataItem as any)?.dataContext?.value ?? 0);
      if (!Number.isFinite(v) || v <= 0) return 0.35;
      return op;
    });

    polygonSeries.mapPolygons.template.events.on("click", (ev) => {
      const dc = ev.target.dataItem?.dataContext as any;
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
    polygonSeriesRef.current?.data.setAll(mapData as any);
  }, [mapData]);

  useEffect(() => {
    const polygonSeries = polygonSeriesRef.current;
    if (!polygonSeries || !selectedUF) return;
    const desired = String(selectedUF).toUpperCase();
    polygonSeries.mapPolygons.each((p) => {
      const dc = p.dataItem?.dataContext as any;
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
