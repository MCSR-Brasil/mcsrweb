"use client";

import { useEffect, useRef, useState } from "react";

export type DvdDonor = {
  name: string;
  headUrl: string;
  headFallbacks: string[];
  amountLabel: string;
  size: number; // px, already scaled by donation curve
};

const RETRY_DELAYS_MS = [4000, 10000]; // retry primary twice before falling back

function HeadImage({ donor }: { donor: DvdDonor }) {
  // Stage 0..N = retrying primary; then walk through headFallbacks.
  const [failCount, setFailCount] = useState(0);
  const src =
    failCount <= RETRY_DELAYS_MS.length
      ? donor.headUrl
      : (donor.headFallbacks[failCount - RETRY_DELAYS_MS.length - 1] ??
        donor.headFallbacks[donor.headFallbacks.length - 1]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={`${src}#${failCount}`}
      src={src}
      alt={`${donor.name} head`}
      width={donor.size}
      height={donor.size}
      draggable={false}
      className="select-none"
      style={{ imageRendering: "pixelated", width: donor.size, height: donor.size }}
      onError={() => {
        const delay =
          failCount < RETRY_DELAYS_MS.length ? RETRY_DELAYS_MS[failCount] : 0;
        setTimeout(() => setFailCount((c) => c + 1), delay);
      }}
    />
  );
}

type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  r: number; // collision radius (circle around the head)
  m: number; // mass, proportional to head area
};

function resolveCollision(a: Body, b: Body) {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;

  let dx = bcx - acx;
  let dy = bcy - acy;
  let dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;
  if (dist >= minDist) return;

  if (dist === 0) {
    dx = 1;
    dy = 0;
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;

  // Push apart so circles no longer overlap (split by inverse mass).
  const overlap = minDist - dist;
  const totalM = a.m + b.m;
  a.x -= nx * overlap * (b.m / totalM);
  a.y -= ny * overlap * (b.m / totalM);
  b.x += nx * overlap * (a.m / totalM);
  b.y += ny * overlap * (a.m / totalM);

  // Elastic collision along the normal with real masses.
  const rvx = b.vx - a.vx;
  const rvy = b.vy - a.vy;
  const relVel = rvx * nx + rvy * ny;
  if (relVel >= 0) return; // already separating

  const impulse = (-(1 + 1) * relVel) / (1 / a.m + 1 / b.m);
  a.vx -= (impulse / a.m) * nx;
  a.vy -= (impulse / a.m) * ny;
  b.vx += (impulse / b.m) * nx;
  b.vy += (impulse / b.m) * ny;
}

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
      const r = donors[i].size / 2;
      return {
        x: Math.random() * Math.max(0, boundsW - w),
        y: Math.random() * Math.max(0, boundsH - h),
        vx,
        vy,
        w,
        h,
        r,
        m: r * r,
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

      const bodies = bodiesRef.current;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          resolveCollision(bodies[i], bodies[j]);
        }
      }
      bodies.forEach((b, i) => {
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
            className="w-full whitespace-nowrap text-center font-semibold text-white"
            style={{
              fontSize: Math.max(16, d.size * 0.16),
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {d.name}
          </div>
          <HeadImage donor={d} />
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
