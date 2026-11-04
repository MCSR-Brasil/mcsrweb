"use client";

import { useEffect, useRef } from "react";

export type DvdDonor = {
  name: string;
  headUrl: string;
  amountLabel: string;
  size: number; // px, already scaled by donation curve
};

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
};

function randomVelocity(): { vx: number; vy: number } {
  const speed = 90 + Math.random() * 90; // px/s
  const angle = Math.random() * Math.PI * 2;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

export function DonationDvd({ donors }: { donors: DvdDonor[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodiesRef = useRef<Body[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || donors.length === 0) return;

    let boundsW = container.clientWidth;
    let boundsH = container.clientHeight;

    // Initialize bodies once nodes are measurable.
    bodiesRef.current = donors.map((_, i) => {
      const el = nodeRefs.current[i];
      const w = el?.offsetWidth ?? donors[i].size;
      const h = el?.offsetHeight ?? donors[i].size + 48;
      const { vx, vy } = randomVelocity();
      return {
        x: Math.random() * Math.max(0, boundsW - w),
        y: Math.random() * Math.max(0, boundsH - h),
        vx,
        vy,
        w,
        h,
      };
    });

    const onResize = () => {
      boundsW = container.clientWidth;
      boundsH = container.clientHeight;
      for (const b of bodiesRef.current) {
        b.x = Math.min(b.x, Math.max(0, boundsW - b.w));
        b.y = Math.min(b.y, Math.max(0, boundsH - b.h));
      }
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      bodiesRef.current.forEach((b, i) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        if (b.x <= 0) {
          b.x = 0;
          b.vx = Math.abs(b.vx);
        } else if (b.x + b.w >= boundsW) {
          b.x = Math.max(0, boundsW - b.w);
          b.vx = -Math.abs(b.vx);
        }

        if (b.y <= 0) {
          b.y = 0;
          b.vy = Math.abs(b.vy);
        } else if (b.y + b.h >= boundsH) {
          b.y = Math.max(0, boundsH - b.h);
          b.vy = -Math.abs(b.vy);
        }

        const el = nodeRefs.current[i];
        if (el) el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [donors]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden"
      style={{ background: "transparent" }}
    >
      {donors.map((d, i) => (
        <div
          key={`${d.name}-${i}`}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 flex flex-col items-center will-change-transform"
          style={{ width: d.size }}
        >
          <div
            className="w-full truncate text-center font-semibold text-white"
            style={{
              fontSize: Math.max(11, d.size * 0.13),
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {d.name}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.headUrl}
            alt={`${d.name} head`}
            width={d.size}
            height={d.size}
            draggable={false}
            className="select-none"
            style={{ imageRendering: "pixelated", width: d.size, height: d.size }}
          />
          <div
            className="w-full truncate text-center font-bold text-emerald-400"
            style={{
              fontSize: Math.max(12, d.size * 0.15),
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {d.amountLabel}
          </div>
        </div>
      ))}
    </div>
  );
}
