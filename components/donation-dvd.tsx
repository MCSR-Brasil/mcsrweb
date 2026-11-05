"use client";

import { useEffect, useRef, useState } from "react";
import type { DvdDonor } from "../lib/donations";

export type { DvdDonor };

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
      loading="lazy"
      decoding="async"
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
  born: number; // timestamp when this head becomes visible
};

function spawn(b: Body, boundsW: number, boundsH: number) {
  b.x = Math.random() * Math.max(0, boundsW - b.w);
  b.y = Math.random() * Math.max(0, boundsH - b.h);
  const { vx, vy } = randomVelocity();
  b.vx = vx;
  b.vy = vy;
}

const SPAWN_STAGGER_MS = 450;

// --- ?fun mode: random wood/slime blocks as colliders ---
type FunBlock = {
  id: number;
  type: "wood" | "slime";
  x: number;
  y: number;
  size: number;
  until: number; // Date.now() timestamp when it despawns
};

const BLOCK_LIFETIME_MS = 18_000;
const BLOCK_SPAWN_EVERY_MS = 5_000;
const BLOCK_MAX_ALIVE = 5;
const BLOCK_SIZE = 72;
const SLIME_BOOST = 1.45;
const MAX_SPEED = 420;

let blockId = 0;

function collideCircleRect(b: Body, blk: FunBlock): boolean {
  // Closest point on the block's rect to the head's center.
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const nx = Math.max(blk.x, Math.min(cx, blk.x + blk.size));
  const ny = Math.max(blk.y, Math.min(cy, blk.y + blk.size));
  const dx = cx - nx;
  const dy = cy - ny;
  const dist = Math.hypot(dx, dy);
  if (dist >= b.r) return false;

  // Push the head out along the collision normal.
  if (dist === 0) {
    // Center is inside the rect: eject via the smallest penetration axis.
    const left = cx - blk.x;
    const right = blk.x + blk.size - cx;
    const top = cy - blk.y;
    const bottom = blk.y + blk.size - cy;
    const min = Math.min(left, right, top, bottom);
    if (min === left) b.x = blk.x - b.w;
    else if (min === right) b.x = blk.x + blk.size;
    else if (min === top) b.y = blk.y - b.h;
    else b.y = blk.y + blk.size;
  } else {
    const push = (b.r - dist) / dist;
    b.x += dx * push;
    b.y += dy * push;
    // Reflect velocity along the normal.
    const ux = dx / dist;
    const uy = dy / dist;
    const dot = b.vx * ux + b.vy * uy;
    if (dot < 0) {
      b.vx -= 2 * dot * ux;
      b.vy -= 2 * dot * uy;
    }
  }

  if (blk.type === "slime") {
    b.vx *= SLIME_BOOST;
    b.vy *= SLIME_BOOST;
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > MAX_SPEED) {
      b.vx = (b.vx / speed) * MAX_SPEED;
      b.vy = (b.vy / speed) * MAX_SPEED;
    }
  }
  return true;
}

const WOOD_STYLE: React.CSSProperties = {
  background:
    "repeating-linear-gradient(90deg, #8a5a2b 0 8px, #6e4420 8px 10px), #7a4e24",
  backgroundBlendMode: "multiply",
  border: "3px solid #4a2f14",
  boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.25)",
};

const SLIME_STYLE: React.CSSProperties = {
  background: "rgba(110, 200, 90, 0.55)",
  border: "3px solid rgba(60, 140, 45, 0.8)",
  boxShadow: "inset 0 0 0 6px rgba(160, 230, 140, 0.35)",
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

function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;
}

export function DonationDvd({
  donors,
  variant = "fixed",
  fun = false,
}: {
  donors: DvdDonor[];
  variant?: "fixed" | "fill";
  fun?: boolean;
}) {
  const [disabled] = useState(isMobileDevice);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodiesRef = useRef<Body[]>([]);
  const blocksRef = useRef<FunBlock[]>([]);
  const [blocks, setBlocks] = useState<FunBlock[]>([]);

  useEffect(() => {
    if (disabled) return;
    const container = containerRef.current;
    if (!container || donors.length === 0) return;

    let boundsW = container.clientWidth;
    let boundsH = container.clientHeight;

    // Initialize bodies once nodes are measurable.
    const t0 = performance.now();
    bodiesRef.current = donors.map((_, i) => {
      const el = nodeRefs.current[i];
      const w = el?.offsetWidth ?? donors[i].size;
      const h = el?.offsetHeight ?? donors[i].size + 48;
      const r = donors[i].size / 2;
      const b: Body = {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        w,
        h,
        r,
        m: r * r,
        born: t0 + i * SPAWN_STAGGER_MS,
      };
      spawn(b, boundsW, boundsH);
      return b;
    });

    const syncBounds = () => {
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      const shrunk = newW < boundsW || newH < boundsH;
      boundsW = newW;
      boundsH = newH;
      for (const b of bodiesRef.current) {
        const out = b.x + b.w > boundsW || b.y + b.h > boundsH;
        if (out && shrunk) {
          spawn(b, boundsW, boundsH); // page shrank: respawn somewhere reachable
        } else {
          b.x = Math.min(Math.max(0, b.x), Math.max(0, boundsW - b.w));
          b.y = Math.min(Math.max(0, b.y), Math.max(0, boundsH - b.h));
        }
      }
    };
    const ro = new ResizeObserver(syncBounds);
    ro.observe(container);
    window.addEventListener("resize", syncBounds);

    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      bodiesRef.current.forEach((b, i) => {
        const el = nodeRefs.current[i];
        if (now < b.born) {
          if (el) el.style.opacity = "0";
          return;
        }
        if (el && el.style.opacity === "0") el.style.opacity = "1";

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

        if (el) el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      });

      const bodies = bodiesRef.current;
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          if (bodies[i].born <= now && bodies[j].born <= now) {
            resolveCollision(bodies[i], bodies[j]);
          }
        }
      }
      if (fun) {
        for (const b of bodies) {
          if (b.born > now) continue;
          for (const blk of blocksRef.current) collideCircleRect(b, blk);
        }
      }

      bodies.forEach((b, i) => {
        const el = nodeRefs.current[i];
        if (el && b.born <= now) {
          el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", syncBounds);
    };
  }, [donors, disabled, fun]);

  // ?fun mode: periodically spawn a random block; each despawns after 18s.
  useEffect(() => {
    if (!fun || disabled) return;
    const tick = () => {
      const container = containerRef.current;
      const now = Date.now();
      blocksRef.current = blocksRef.current.filter((b) => b.until > now);
      if (container && blocksRef.current.length < BLOCK_MAX_ALIVE) {
        const size = BLOCK_SIZE;
        blocksRef.current.push({
          id: ++blockId,
          type: Math.random() < 0.5 ? "wood" : "slime",
          x: Math.random() * Math.max(0, container.clientWidth - size),
          y: Math.random() * Math.max(0, container.clientHeight - size),
          size,
          until: now + BLOCK_LIFETIME_MS,
        });
      }
      setBlocks([...blocksRef.current]);
    };
    const interval = setInterval(tick, BLOCK_SPAWN_EVERY_MS);
    tick();
    return () => clearInterval(interval);
  }, [fun, disabled]);

  if (disabled) return null;

  return (
    <div
      ref={containerRef}
      className={`${variant === "fixed" ? "fixed" : "absolute"} inset-0 overflow-hidden${variant === "fill" ? " pointer-events-none" : ""}`}
      style={{ background: "transparent" }}
    >
      {blocks.map((blk) => (
        <div
          key={blk.id}
          className="absolute select-none"
          style={{
            left: blk.x,
            top: blk.y,
            width: blk.size,
            height: blk.size,
            imageRendering: "pixelated",
            ...(blk.type === "wood" ? WOOD_STYLE : SLIME_STYLE),
          }}
        />
      ))}
      <div
        className="fixed bottom-3 left-4 z-10 select-none text-left text-xs font-bold leading-snug text-emerald-500 opacity-80 sm:text-sm"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
      >
        Obrigado a todos
        <br />
        Que doaram para
        <br />
        nossa Comunidade
      </div>
      {donors.map((d, i) => (
        <div
          key={`${d.name}-${i}`}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 flex flex-col items-center transition-opacity duration-300 will-change-transform"
          style={{ width: d.size, opacity: 0 }}
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
