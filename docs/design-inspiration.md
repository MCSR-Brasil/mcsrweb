# Design Inspiration: CBM Speedrunning

Source analyzed: https://cbm-speedrunning.vercel.app/tabelas

## 1. Typography

- **Body / UI:** Geist Sans — clean, modern, highly legible variable sans-serif.
- **Monospace / data:** Geist Mono — used for numbers, timestamps, run IDs.
- **Display / brand:** a custom Minecraft-style typeface (`MinecraftRegular`, `MinecraftFifty_Solid`) only for headings, logos and major callouts.

**Takeaway:** keep the existing Minecraft font only for titles and the brand. Use Geist for body text, buttons, and data so the UI feels lighter.

## 2. Color System (dark-first)

The reference site ships a dark-first shadcn/ui-style token set:

| token | value |
| --- | --- |
| `--background` | `#0a0a0a` |
| `--foreground` | `#fafafa` |
| `--card` | `#171717` |
| `--card-foreground` | `#fafafa` |
| `--muted` | `#262626` |
| `--muted-foreground` | `#a1a1a1` |
| `--primary` | `#e5e5e5` |
| `--primary-foreground` | `#171717` |
| `--secondary` | `#262626` |
| `--secondary-foreground` | `#fafafa` |
| `--destructive` | `#ff6568` |
| `--border` | `rgba(255,255,255,0.1)` |
| `--input` | `rgba(255,255,255,0.15)` |
| `--ring` | `#737373` |
| `--radius` | `0.625rem` |

Chart / accent colors:
- `#1447e6` (blue), `#00bb7f` (emerald), `#f99c00` (amber), `#ac4bff` (purple), `#ff2357` (rose)

**Takeaway:** move away from heavy glassmorphism (`bg-white/60 backdrop-blur`) toward solid card surfaces with subtle borders. Increase contrast between text and secondary text using `muted-foreground`.

## 3. Components & Layout Ideas

- **Cards:** solid `bg-card` with `border-border` and `rounded-xl` (`0.625rem`).
- **Hover states:** `scale-[1.02]`, lifted shadow, or a border color shift rather than a full background swap.
- **Rank medals:** use consistent accent colors by placement (gold, silver, bronze, emerald) and keep them large and readable.
- **Badges / pills:** small rounded pills with translucent background tints (`bg-accent/10` or category-specific tints).
- **Tables / leaderboards:** clear column alignment, monospace for numbers, muted-foreground for labels.
- **Nav:** minimal sticky header, `bg-background/80` + `backdrop-blur-sm`, border-bottom `border-border`, active item highlighted with a subtle filled pill.

## 4. Motion

Custom keyframes from the reference site:

- `fade-in-up`: opacity 0 → 1, translateY 20px → 0 (0.5s ease-out).
- `fade-in-scale`: opacity 0 → 1, scale 0.9 → 1 (0.5s ease-out).
- `float`: gentle Y-axis bob (6s ease-in-out infinite) — nice for empty-state icons / heroes.
- `glow-pulse`: drop-shadow breathing (4s) — can be used sparingly on the brand logo.

**Takeaway:** add these as utility classes and apply them on page enter and major cards so the app feels alive without being distracting.

## 5. Recommended Action Plan

1. **Foundation:** define the CSS variables in `app/globals.css` and wire Tailwind to a class-based dark strategy.
2. **Font stack:** make Geist Sans the body font; reserve the Minecraft font for headings via `font-minecraft`.
3. **Update surfaces:** convert translucent leaderboard/state panels to `bg-card` + `border-border`.
4. **Standardize radius:** use `--radius: 0.625rem` (Tailwind `rounded-xl`).
5. **Add motion utilities:** `animate-fade-in-up`, `animate-fade-in-scale`, `animate-float`, `animate-glow-pulse`.
6. **Refine accents:** use the chart palette for category tags, rank medals and map heatmap.
7. **Simplify nav:** cleaner active state, less double borders.

## 6. What to Avoid

- Do not keep Minecraft font for body text — it gets hard to read at small sizes.
- Avoid stacking many semi-transparent layers; solid cards are crisper.
- Avoid too many competing accent colors on one screen.
