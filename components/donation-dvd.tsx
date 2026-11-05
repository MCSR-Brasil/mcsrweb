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
  hp: number;
  maxHp: number;
  deadUntil: number; // performance.now() timestamp to respawn, 0 = alive
  lastHitAt: number; // damage cooldown
  respawnMs: number; // bigger heads take longer to come back
  dmgMult: number; // damage multiplier (strength potion)
  buffUntil: number; // performance.now() timestamp when strength wears off
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
  type: "wood" | "stone" | "slime";
  x: number;
  y: number;
  size: number;
  until: number; // Date.now() timestamp when it despawns
};

const BLOCK_LIFETIME_MS = 24_000;
const BLOCK_SPAWN_EVERY_MS = 5_000;
const BLOCK_MAX_ALIVE = 5;
const BLOCK_SIZE = 96;
const SLIME_BOOST = 1.4;
const MAX_SPEED = 560;
const WOOD_DRAG = 0.98; // wood/stone hits remove 2% of speed
const HIT_COOLDOWN_MS = 700;
const RESPAWN_MIN_MS = 12_000; // smallest heads respawn fast
const RESPAWN_MAX_MS = 60_000; // boss heads take up to a minute
const ATTACKER_BOOST = 1.1; // small speed bonus for a clean hit
const APPROACH_MIN = 20; // px/s toward the other head to count as attacking

// --- ?fun mode: pickup items ---
type FunItem = {
  id: number;
  kind: "strength" | "apple";
  x: number;
  y: number;
  size: number;
  until: number; // Date.now() timestamp when it despawns
};

const ITEM_SPAWN_EVERY_MS = 12_000;
const ITEM_MAX_ALIVE = 2;
const ITEM_LIFETIME_MS = 20_000;
const ITEM_SIZE = 40;
const STRENGTH_MULT = 1.3;
const STRENGTH_DURATION_MS = 10_000;
const APPLE_HEAL = 10;

const MC_ITEM_TEX =
  "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures/item";

const STRENGTH_STYLE: React.CSSProperties = {
  backgroundImage: `url(${MC_ITEM_TEX}/potion.png)`,
  backgroundSize: "100% 100%",
  filter: "drop-shadow(0 0 6px rgba(255,60,60,0.8))",
};

const APPLE_STYLE: React.CSSProperties = {
  backgroundImage: `url(${MC_ITEM_TEX}/golden_apple.png)`,
  backgroundSize: "100% 100%",
  filter: "drop-shadow(0 0 6px rgba(255,215,0,0.8))",
};

let itemId = 0;

const MC_TEX_BASE =
  "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures/block";

const WOOD_STYLE: React.CSSProperties = {
  backgroundImage: `url(${MC_TEX_BASE}/oak_planks.png)`,
  backgroundSize: "100% 100%",
};

const SLIME_STYLE: React.CSSProperties = {
  backgroundImage: `url(${MC_TEX_BASE}/slime_block.png)`,
  backgroundSize: "100% 100%",
};

const STONE_STYLE: React.CSSProperties = {
  backgroundImage: `url(${MC_TEX_BASE}/stone_bricks.png)`,
  backgroundSize: "100% 100%",
};

function blockStyle(type: FunBlock["type"]): React.CSSProperties {
  if (type === "wood") return WOOD_STYLE;
  if (type === "stone") return STONE_STYLE;
  return SLIME_STYLE;
}

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
      if (blk.type === "slime") {
        b.vx *= SLIME_BOOST;
        b.vy *= SLIME_BOOST;
        const speed = Math.hypot(b.vx, b.vy);
        if (speed > MAX_SPEED) {
          b.vx = (b.vx / speed) * MAX_SPEED;
          b.vy = (b.vy / speed) * MAX_SPEED;
        }
      } else {
        b.vx *= WOOD_DRAG;
        b.vy *= WOOD_DRAG;
      }
    }
  }
  return true;
}

function resolveCollision(a: Body, b: Body): boolean {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;

  let dx = bcx - acx;
  let dy = bcy - acy;
  let dist = Math.hypot(dx, dy);
  const minDist = a.r + b.r;
  if (dist >= minDist) return false;

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
  if (relVel >= 0) return false; // already separating

  const impulse = (-(1 + 1) * relVel) / (1 / a.m + 1 / b.m);
  a.vx -= (impulse / a.m) * nx;
  a.vy -= (impulse / a.m) * ny;
  b.vx += (impulse / b.m) * nx;
  b.vy += (impulse / b.m) * ny;
  return true;
}

function randomVelocity(): { vx: number; vy: number } {
  const speed = 90 + Math.random() * 90; // px/s
  const angle = Math.random() * Math.PI * 2;
  return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
}

function FunBlockEl({ blk }: { blk: FunBlock }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpacity(1));
    // Fade out shortly before the block despawns.
    const fadeOutAt = Math.max(0, blk.until - Date.now() - 400);
    const t = setTimeout(() => setOpacity(0), fadeOutAt);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [blk.until]);

  return (
    <div
      className="absolute select-none transition-opacity duration-300"
      style={{
        left: blk.x,
        top: blk.y,
        width: blk.size,
        height: blk.size,
        imageRendering: "pixelated",
        opacity,
        ...blockStyle(blk.type),
      }}
    />
  );
}

function FunItemEl({ it }: { it: FunItem }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOpacity(1));
    const fadeOutAt = Math.max(0, it.until - Date.now() - 400);
    const t = setTimeout(() => setOpacity(0), fadeOutAt);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [it.until]);

  return (
    <div
      className="absolute select-none transition-opacity duration-300"
      style={{
        left: it.x,
        top: it.y,
        width: it.size,
        height: it.size,
        imageRendering: "pixelated",
        opacity,
        ...(it.kind === "strength" ? STRENGTH_STYLE : APPLE_STYLE),
      }}
    />
  );
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
  const hpBarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hurtRefs = useRef<(HTMLDivElement | null)[]>([]);
  const healRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blocksRef = useRef<FunBlock[]>([]);
  const [blocks, setBlocks] = useState<FunBlock[]>([]);
  const itemsRef = useRef<FunItem[]>([]);
  const [items, setItems] = useState<FunItem[]>([]);

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
      // More money = boss-level life: steep quadratic ~6..48 HP by head size.
      const sizeT = donors[i].size / 150;
      const maxHp = 3 + Math.round(sizeT * sizeT * 45);
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
        hp: maxHp,
        maxHp,
        deadUntil: 0,
        lastHitAt: 0,
        respawnMs: RESPAWN_MIN_MS + sizeT * (RESPAWN_MAX_MS - RESPAWN_MIN_MS),
        dmgMult: 1,
        buffUntil: 0,
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

      const damage = (b: Body, i: number, amount = 1) => {
        if (b.deadUntil > 0 || now - b.lastHitAt < HIT_COOLDOWN_MS) return;
        b.lastHitAt = now;
        b.hp = Math.max(0, b.hp - amount);
        const bar = hpBarRefs.current[i];
        if (bar) bar.style.width = `${(b.hp / b.maxHp) * 100}%`;
        // Minecraft-style red hurt flash.
        const hurt = hurtRefs.current[i];
        if (hurt) {
          hurt.style.opacity = "0.55";
          setTimeout(() => {
            hurt.style.opacity = "0";
          }, 160);
        }
        if (b.hp === 0) b.deadUntil = now + b.respawnMs;
      };

      bodiesRef.current.forEach((b, i) => {
        const el = nodeRefs.current[i];
        if (b.deadUntil > 0) {
          if (now < b.deadUntil) {
            if (el && el.style.opacity !== "0") el.style.opacity = "0";
            return;
          }
          // Respawn: fade back in at a random spot with full HP.
          b.deadUntil = 0;
          b.hp = b.maxHp;
          b.dmgMult = 1;
          b.buffUntil = 0;
          spawn(b, boundsW, boundsH);
          const bar = hpBarRefs.current[i];
          if (bar) bar.style.width = "100%";
          if (el) el.style.opacity = "1";
        }
        if (now < b.born) {
          if (el) el.style.opacity = "0";
          return;
        }
        if (el && el.style.opacity === "0") el.style.opacity = "1";

        // Strength buff expiry + pulsing ring visibility.
        const ring = ringRefs.current[i];
        if (b.buffUntil > 0 && now >= b.buffUntil) {
          b.buffUntil = 0;
          b.dmgMult = 1;
        }
        if (ring) ring.style.display = b.buffUntil > now ? "block" : "none";

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
          const a = bodies[i];
          const c = bodies[j];
          if (a.born > now || c.born > now || a.deadUntil > 0 || c.deadUntil > 0) continue;

          // Who is charging whom? Check approach speeds along the collision
          // normal BEFORE resolving, so we know who dealt the hit.
          const nx = c.x + c.w / 2 - (a.x + a.w / 2);
          const ny = c.y + c.h / 2 - (a.y + a.h / 2);
          const dist = Math.hypot(nx, ny);
          const aApproach = dist > 0 && (a.vx * nx + a.vy * ny) / dist > APPROACH_MIN;
          const cApproach = dist > 0 && (c.vx * nx + c.vy * ny) / dist < -APPROACH_MIN;

          if (!resolveCollision(a, c) || !fun) continue;

          const boost = (b: Body) => {
            b.vx *= ATTACKER_BOOST;
            b.vy *= ATTACKER_BOOST;
            const s = Math.hypot(b.vx, b.vy);
            if (s > MAX_SPEED) {
              b.vx = (b.vx / s) * MAX_SPEED;
              b.vy = (b.vy / s) * MAX_SPEED;
            }
          };
          if (aApproach && cApproach) {
            damage(a, i, c.dmgMult); // head-on clash: both take the hit
            damage(c, j, a.dmgMult);
          } else if (aApproach) {
            damage(c, j, a.dmgMult); // a charged into c — only the victim is hurt
            boost(a);
          } else if (cApproach) {
            damage(a, i, c.dmgMult);
            boost(c);
          }
        }
      }
      if (fun) {
        for (const b of bodies) {
          if (b.born > now || b.deadUntil > 0) continue;
          for (const blk of blocksRef.current) collideCircleRect(b, blk);
        }

        // Item pickups.
        let picked = false;
        itemsRef.current = itemsRef.current.filter((it) => {
          const icx = it.x + it.size / 2;
          const icy = it.y + it.size / 2;
          for (let i = 0; i < bodies.length; i++) {
            const b = bodies[i];
            if (b.born > now || b.deadUntil > 0) continue;
            const d = Math.hypot(b.x + b.w / 2 - icx, b.y + b.h / 2 - icy);
            if (d >= b.r + it.size * 0.4) continue;

            picked = true;
            if (it.kind === "strength") {
              b.dmgMult = STRENGTH_MULT;
              b.buffUntil = now + STRENGTH_DURATION_MS;
            } else {
              b.hp = Math.min(b.maxHp, b.hp + APPLE_HEAL);
              const bar = hpBarRefs.current[i];
              if (bar) bar.style.width = `${(b.hp / b.maxHp) * 100}%`;
              const heal = healRefs.current[i];
              if (heal) {
                heal.style.opacity = "0.55";
                setTimeout(() => {
                  heal.style.opacity = "0";
                }, 160);
              }
            }
            return false;
          }
          return true;
        });
        if (picked) setItems([...itemsRef.current]);
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

  // ?fun mode: periodically spawn a random block; each despawns after 24s.
  useEffect(() => {
    if (!fun || disabled) return;
    const tick = () => {
      const container = containerRef.current;
      const now = Date.now();
      blocksRef.current = blocksRef.current.filter((b) => b.until > now);
      if (container && blocksRef.current.length < BLOCK_MAX_ALIVE) {
        const size = BLOCK_SIZE;
        const roll = Math.random();
        blocksRef.current.push({
          id: ++blockId,
          type: roll < 0.4 ? "wood" : roll < 0.7 ? "stone" : "slime",
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

  // ?fun mode: periodically spawn a pickup item; each despawns after 15s.
  useEffect(() => {
    if (!fun || disabled) return;
    const tick = () => {
      const container = containerRef.current;
      const now = Date.now();
      itemsRef.current = itemsRef.current.filter((it) => it.until > now);
      if (container && itemsRef.current.length < ITEM_MAX_ALIVE) {
        const size = ITEM_SIZE;
        itemsRef.current.push({
          id: ++itemId,
          kind: Math.random() < 0.5 ? "strength" : "apple",
          x: Math.random() * Math.max(0, container.clientWidth - size),
          y: Math.random() * Math.max(0, container.clientHeight - size),
          size,
          until: now + ITEM_LIFETIME_MS,
        });
      }
      setItems([...itemsRef.current]);
    };
    const interval = setInterval(tick, ITEM_SPAWN_EVERY_MS);
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
      {fun ? (
        <style>{`@keyframes dvd-buff-pulse { 0% { transform: scale(0.9); opacity: 0.9; } 100% { transform: scale(1.6); opacity: 0; } }`}</style>
      ) : null}
      {blocks.map((blk) => (
        <FunBlockEl key={`b${blk.id}`} blk={blk} />
      ))}
      {items.map((it) => (
        <FunItemEl key={`i${it.id}`} it={it} />
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
          {fun ? (
            <div
              className="mb-1 w-full overflow-hidden rounded-sm bg-red-600"
              style={{ height: Math.max(4, d.size * 0.055) }}
            >
              <div
                ref={(el) => {
                  hpBarRefs.current[i] = el;
                }}
                className="h-full bg-green-500 transition-[width] duration-200"
                style={{ width: "100%" }}
              />
            </div>
          ) : null}
          <div
            className="w-full whitespace-nowrap text-center font-semibold text-white"
            style={{
              fontSize: Math.max(16, d.size * 0.16),
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {d.name}
          </div>
          <div className="relative" style={{ width: d.size, height: d.size }}>
            {fun ? (
              <div
                ref={(el) => {
                  ringRefs.current[i] = el;
                }}
                className="pointer-events-none absolute rounded-full border-2 border-orange-400"
                style={{
                  display: "none",
                  inset: -d.size * 0.08,
                  animation: "dvd-buff-pulse 1.2s ease-out infinite",
                }}
              />
            ) : null}
            <HeadImage donor={d} />
            {fun ? (
              <>
                <div
                  ref={(el) => {
                    hurtRefs.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 bg-red-500 opacity-0 transition-opacity duration-300"
                />
                <div
                  ref={(el) => {
                    healRefs.current[i] = el;
                  }}
                  className="pointer-events-none absolute inset-0 bg-green-500 opacity-0 transition-opacity duration-300"
                />
              </>
            ) : null}
          </div>
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
