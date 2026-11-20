# Glassmorphism research — TontineSats

Status: **implemented** in `src/` (see §9 for the final values and deviations from this plan). The landing colour-token fix from the earlier turn is also in place.

Scope requested: turn every page into glassmorphism **except the login page**, keep the current palette and product rules, and research the style before touching code.

---

## 1. What glassmorphism is (source synthesis)

Glassmorphism is a UI material style where foreground containers are partially transparent and blur whatever sits behind them, producing depth without heavy shadows. It has two defining properties: **fill opacity** and **background blur**; borders and gradients are optional depth cues ([NN/g, 2024](https://www.nngroup.com/articles/glassmorphism/)).

Technical definition: `backdrop-filter: blur(...)` filters the pixels painted behind an element, up to the nearest **backdrop root**; the element itself must be transparent or partially transparent for the effect to be visible ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)). Baseline since September 2024.

Two modern reference systems:

- **Apple Liquid Glass** (June 2025): a translucent functional layer that "reflects and refracts its surroundings" and adapts between light and dark, used for controls and navigation rather than for body text ([Apple Newsroom](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/), [HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
- **Microsoft Fluent Acrylic**: blur + tint + noise; the tint is what keeps text legible over arbitrary desktop wallpapers ([Fluent 2 Material](https://fluent2.microsoft.design/material)).

Both systems confirm the important part: **glass = blur + tint, not blur alone.** The tint sets a contrast floor; without it the same component fails or passes depending on what happens to sit behind it.

The `design-style` skill's glass entry (difficulty 3/5, DNA roundness 4, contrast 2) gives the canonical recipe:

```css
background: rgba(255, 255, 255, 0.15);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.25);
border-radius: 20px;
```

and its do/don't list: layer on gradients, keep borders translucent, add colour blobs behind; don't use opaque fills, too many layers, heavy shadows, or small blur values.

---

## 2. Reference survey

| Reference | What to take | What to avoid |
| :--- | :--- | :--- |
| [NN/g — Glassmorphism: Definition and Best Practices](https://www.nngroup.com/articles/glassmorphism/) | Contrast first; **more blur is better** over busy backgrounds; strokes/gradients create depth even on flat backgrounds; risk of overuse | Low-blur "see-through" panels that keep the background readable; glass on every element |
| [MDN — `backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter) | Correct property, `-webkit-` prefix, `@supports` fallback; backdrop-root rule (ancestor `opacity < 1`, `filter`, `mask`, `clip-path`, `mix-blend-mode` resets the backdrop) | Nesting glass inside a wrapper that animates opacity — the blur loses the page behind it |
| [Apple Liquid Glass / HIG Materials](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/) | Glass as a functional layer above content; adaptive light/dark; restrained use on navigation and controls | Glass panels carrying long-form text or dense financial tables |
| [Fluent 2 — Material (Acrylic)](https://fluent2.microsoft.design/material) | Blur + tint + noise for readability over arbitrary backgrounds | Heavy acrylic on every card in a scroll view |
| [Tailwind v4 — backdrop blur](https://tailwindcss.com/docs/backdrop-filter-blur) | `backdrop-blur-*`, `backdrop-saturate-*` utilities; arbitrary values for tinted fills and borders | Composing blur per repeated list row (see §5) |
| [WCAG 2.2 SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) | 4.5:1 body text, 3:1 large text; test the **composited** colour, not the fill | Judging contrast against the panel colour alone |
| [Awwwards glassmorphism collection](https://www.awwwards.com/websites/glassmorphism/) | Visual index of current executions (gallery is JS-rendered; reviewed as a style reference, not quoted) | The recurring purple/pink gradient cliché |
| `design-style` skill (`previews/glass.png`, entry #2) | Palette, CSS snippet, prompt keywords, do/don't | Its purple→pink palette — it clashes with TontineSats' navy/emerald brand |

Style reference `previews/glass.png`: frosted card over a purple-blue mesh, 1px white border, heavy padding, one primary action. The composition is what we want; the hue is what we replace.

---

## 3. Translation to TontineSats

### Colour story

Keep the brand: **navy `#0F2942`, emerald `#047857`, sky `#38BDF8`, warm sand `#B45309`**. Replace the generic purple mesh with a Dakar-evoking mesh — deep navy base, emerald/teal glow around the pot, a restrained warm sand highlight — so the glass refracts the product's own colours.

Light mode: pale slate canvas with 25–40% tint blobs. Dark mode: navy canvas with 18–28% tint blobs and lower saturation, so glass reads as smoked glass rather than neon.

### Three glass tiers (never more than three)

| Tier | Use | Blur | Fill (light / dark) |
| :--- | :--- | :--- | :--- |
| `glass-chrome` | Sidebar, mobile header, bottom tabs, sheet panels | 24–28px | 70–78% background tint / 62–70% navy tint |
| `glass-panel` | Page sections, cards, calendar, receipt | 18–22px | 55–65% white / 55–62% navy |
| `glass-chip` | Pills, tags, segmented control, small badges | 10–12px | 45–55% white / 45% navy |

Chrome gets the strongest tint because navigation labels must survive any scroll position. Chips get the least because they are small and non-critical.

### Proposed tokens (`src/index.css`)

```css
:root {
  --glass-blur-panel: 20px;
  --glass-blur-chrome: 26px;
  --glass-blur-chip: 10px;
  --glass-saturate: 140%;

  --glass-panel: color-mix(in srgb, #ffffff 62%, transparent);
  --glass-chrome: color-mix(in srgb, #ffffff 76%, transparent);
  --glass-chip: color-mix(in srgb, #ffffff 50%, transparent);

  --glass-border: color-mix(in srgb, #ffffff 55%, transparent);
  --glass-highlight: color-mix(in srgb, #ffffff 75%, transparent);
  --glass-shadow: 0 18px 40px -20px color-mix(in srgb, #0f172a 30%, transparent);

  --mesh-navy: #0f2942;
  --mesh-emerald: #047857;
  --mesh-sky: #38bdf8;
  --mesh-sand: #b45309;
}

[data-theme='dark'] {
  --glass-panel: color-mix(in srgb, #0b1220 58%, transparent);
  --glass-chrome: color-mix(in srgb, #0b1220 70%, transparent);
  --glass-chip: color-mix(in srgb, #0b1220 46%, transparent);

  --glass-border: color-mix(in srgb, #ffffff 16%, transparent);
  --glass-highlight: color-mix(in srgb, #ffffff 28%, transparent);
  --glass-shadow: 0 18px 40px -20px color-mix(in srgb, #000000 60%, transparent);
}
```

These follow the existing rule that hex lives only in `src/index.css`; components consume tokens and utilities.

### Utilities

```css
@utility glass-panel {
  background: var(--glass-panel);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight), var(--glass-shadow);
  backdrop-filter: blur(var(--glass-blur-panel)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-panel)) saturate(var(--glass-saturate));
}
```

Same shape for `glass-chrome` and `glass-chip`. Page canvas:

```css
.app-canvas {
  background:
    radial-gradient(70rem 44rem at 10% -12%, color-mix(in srgb, var(--mesh-emerald) 42%, transparent), transparent 62%),
    radial-gradient(58rem 40rem at 96% 4%, color-mix(in srgb, var(--mesh-sky) 38%, transparent), transparent 66%),
    radial-gradient(52rem 38rem at 46% 112%, color-mix(in srgb, var(--mesh-sand) 26%, transparent), transparent 64%),
    var(--background);
}
```

Static, no animated gradient: an animating backdrop forces the browser to re-blur every frame. A 3–5% SVG noise overlay kills gradient banding.

### Fallbacks

```css
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-panel, .glass-chrome, .glass-chip { background: var(--card); }
}

@media (prefers-reduced-transparency: reduce) {
  .glass-panel, .glass-chrome, .glass-chip { backdrop-filter: none; background: var(--card); }
}

@media print {
  .glass-panel, .glass-chrome, .glass-chip { backdrop-filter: none; background: #ffffff; box-shadow: none; }
}
```

`prefers-reduced-transparency` is Safari-only today; it is progressive enhancement, not the only fallback.

---

## 4. Page-by-page application map

| Route | Current surface | Glass plan | Blurred layers |
| :--- | :--- | :--- | :--- |
| `/` Landing | solid navy hero | Mesh canvas; hero copy on the canvas; preview pot becomes `glass-panel`; language switch + sign-in become `glass-chip` | 2 |
| `/auth` **login / identity entry** | solid `bg-background` | **Excluded.** Keep solid card, solid buttons, no mesh | 0 |
| `/auth?mode=*` create/import/extension | solid card + inputs | **Excluded** (same auth flow) | 0 |
| `/app` shell | solid sidebar, sticky header, tab bar | Mesh canvas on the page; sidebar/header/tab bar become `glass-chrome` | 3 chrome |
| `/app` Dashboard | navy hero, 2 side cards, progress card, 8 payout rows | Hero keeps its opaque navy (identity anchor) with a glass rim; side cards → `glass-panel`; chips → `glass-chip`; payout rows stay **one** `glass-panel` section with flat rows | 4–5 |
| `/app/activity` | calendar card + history cards | Calendar → `glass-panel`; history → one panel with flat rows | 3 |
| `/app/passport` | header + receipt cards | Header → `glass-panel`; receipts → one panel | 3 |
| `/app/settings` | 3 section cards | Each section → `glass-panel`; controls stay solid | 3–4 |
| `/app/receipt/:round` | single receipt column | Receipt → `glass-panel`; proof timeline flat inside | 2 |
| `/join/:code` | invite card | `glass-panel` over mesh | 2 |
| Payment / member / invite sheets | solid `bg-card` sheet | Scrim gets `blur(10px)`; sheet gets `glass-chrome` (strong tint) | 2 |

The login exclusion can mean two things; see §7.

### What stays solid, on purpose

- All **text surfaces inside glass**: glass is the container, not the typography. Body copy sits on the tinted fill, never directly on the mesh.
- **Buttons, inputs, switches, segmented controls**: solid or near-solid fills; translucent controls at 44px are a contrast and target-size trap.
- **The dashboard pot ring**: it is the product anchor; keep `--hero-surface` and add only a 1px inner highlight so it reads as the same family as the glass.
- **Repeated list rows**: see §5.

---

## 5. Constraints and failure modes

### Contrast

Glass text contrast depends on the composite of mesh + blur + tint. Rule: **tint floor** of 55% in dark and 60% in light for any panel carrying body text. Verify by sampling the rendered composite (screenshot pixel sampling like the colour audit in the previous turn), not the token value.

Worst cases to test: light panel over the darkest mesh blob; dark panel over the brightest sky blob. Target 4.5:1 for body, 3:1 for large text and non-text icons ([WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

### Blur cost

`backdrop-filter` is GPU work proportional to the blurred area. The app's payout list has eight cards; making each one glass would mean eight live blur layers while scrolling. Rules:

- Budget: **≤6 blurred layers visible at once**, blur ≤24px (mobile 14–18px).
- Never blur per list row. One glass section, flat rows inside.
- No animated blur radius, no animated mesh behind glass.
- Test with 4× CPU throttle on a 390px viewport; scroll the dashboard and activity; target no long tasks and stable frame timing.
- Respect reduced motion (mesh is static anyway) and reduced transparency.

### Backdrop-root trap

The current `.animate-rise` animates `opacity` from 0 to 1. While it runs, the element becomes a backdrop root, so a `backdrop-filter` child cannot see the page behind it; after it finishes at opacity 1 the blur works, producing a visible "pop". Glass panels should use transform-only entrances, or drop `animate-rise` on glass containers.

### Print / export

The receipt is evidence. `@media print` must force solid white, no blur, no shadow.

---

## 6. Implementation phases (after approval)

1. **Tokens + utilities + canvas + fallbacks** in `src/index.css`; no page changes yet. Screenshot the existing app to prove nothing moved.
2. **Chrome**: AppShell sidebar, mobile header, bottom tab bar, sheet scrim/panel.
3. **Dashboard**: hero rim, side cards, chips, payout section as one panel.
4. **Activity, Passport, Settings, Receipt, Join**.
5. **Landing** (if in scope) — mesh + preview card; verify the CTA contrast.
6. **Verification**: light/dark desktop + 390px; contrast sampling; 4× CPU scroll check; reduced motion; keyboard focus rings visible on glass; zero console exceptions; no horizontal overflow; typecheck + build; screenshots in `shots-web/`; CHANGELOG + README.

Estimated diff: `index.css` (tokens/utilities), `AppShell.tsx`, `ui.tsx` (Sheet/Pill), 7 page files; login files untouched.

---

## 7. Decisions (confirmed)

- **Login boundary:** the whole `/auth*` flow stays solid — entry card, create/import/extension forms, recovery words, profile step. Glass starts at `/app`; the landing is in scope.
- **Palette:** brand mesh — navy `#0F2942` base, emerald `#047857` and sky `#38BDF8` glows, restrained sand `#B45309` highlight. No purple/pink.
- **Landing:** in scope. Mesh canvas, glass pot-preview card, glass language switch; headline stays white on the canvas.
- **List treatment:** one `glass-panel` per list, flat rows inside. No per-row blur.
- **Dark mode:** keep glass with a smoked navy tint.

Still open at implementation time: exact blur values per breakpoint (proposal: 18–22px panels, 24–28px chrome, 10–12px chips; mobile 14–18px for panels) and whether the dashboard hero stays opaque navy with a glass rim (recommended) or becomes glass itself.

---

## 8. Implemented (final)

A second pass raised the blur, added a landing-specific backdrop, and fixed what the first pass could not show. What shipped:

1. **Landing dot field.** A canvas dot field replaces the flat navy: 20px pitch (15px under 640px), four brand-tinted dot colours from `--dot-*` tokens, deterministic jitter. A pointer within 160px enlarges dots up to 1.9× and displaces them up to 8px, eased through a smoothed pointer; the field is damped to zero over text and cards and falls back to static for reduced motion and touch. No image asset, no runtime download.
2. **Smoked landing glass.** `glass-veil` uses 64px blur, a 62% `--hero-surface` fill, a 9% white sheen, a 22% hairline, and a top highlight. The smoked fill is what keeps white label text above 4.5:1 over the teal mesh; the earlier 12% white tint measured about 3.5:1 for the sats line.
3. **App glass raised to 48/56px.** Panels 48px, chrome and sheets 56px, flat rows still 0. Light tints 40/50/42%, dark 56/64/48%. Mesh raised to 64/54/44% light and 52/46/34% dark, plus a 5% SVG turbulence layer and a 9% / 1.2px dot grid. Contrast re-measured after the change: sidebar 5.1:1, cards 6.9–7.4:1 light, 8.1–8.4:1 dark.
4. **Dark muted text lifted from `#94A3B8` to `#A3B0C2` inside the app canvas only.** `/auth*` keeps the original token and has no glass.
5. **One shared ring clock.** `useProgress(700)` drives the arc and the number from the same eased value, so the dashboard's five paid arcs and the 0 → 192 000 count finish together; Passport runs 0 → 92% the same way. No CSS transition and no second timer.

Measured on rendered screenshots (pixel sampling, not tokens): landing footer 5.0:1, landing proof body 6.4:1, landing panel labels 6.2:1, app light 5.1–7.4:1, dark 8.1–8.4:1. No horizontal overflow at 375px on `/`, `/app`, or `/app/activity` with the picker open. Login (`/auth`, `/auth?mode=*`) is untouched.

Caveat: blur only reads where the backdrop has detail. Over a smooth mesh it looks like tint; the landing dot field is the place where the 64px blur is visible (dots disappear under the panels). The reference look also depends on its photo; with a dot-only backdrop the glass is subtler by design.

Not done: `prefers-reduced-transparency` remains Safari-only, and no low-end Android FPS run was done. Fallback if 48/56 stutters: 40/48 via the two tokens.

---

## 9. Sources

- NN/g, *Glassmorphism: Definition and Best Practices*, 2024 — https://www.nngroup.com/articles/glassmorphism/
- MDN, *`backdrop-filter`* — https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter
- Apple Newsroom, *Apple introduces a delightful and elegant new software design*, June 2025 — https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/
- Apple HIG, *Materials* — https://developer.apple.com/design/human-interface-guidelines/materials
- Microsoft Fluent 2, *Material (Acrylic)* — https://fluent2.microsoft.design/material
- Tailwind CSS v4, *backdrop-filter: blur()* — https://tailwindcss.com/docs/backdrop-filter-blur
- W3C WAI, *Understanding SC 1.4.3: Contrast (Minimum)* — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Awwwards, *Glassmorphism websites* — https://www.awwwards.com/websites/glassmorphism/
- `design-style` skill, entry #2 `glass`, and `previews/glass.png` (local)
