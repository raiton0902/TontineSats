# Frontend Design PRD & Visual Constitution

> **STATUS:** LOCKED & APPROVED — §5 amended 2026-11-07 (motion-rich direction)  
> **PROJECT:** TontineSats  
> **ARCHETYPE:** FinTech, Softened for Everyday Users (High-Trust Community Finance)  
> **TARGET STACK:** React 19 + Vite (TypeScript) PWA + Tailwind CSS  

---

## 1. Executive Summary & Design Mission
* **Primary Archetype:** FinTech & Community Trust (Archetype 5 softened for West African mobile accessibility).
* **Design Philosophy:** Bank-grade clarity and tabular accuracy for money (`FCFA`, `EUR`, `Sats`), paired with large touch targets, zero crypto jargon on the main screen, and instant French/Wolof readability on entry-level Android screens.
* **Target Viewports:** Mobile-first (`360px–430px` primary target), Tablet (`768px–1024px`), Desktop (`1280px` max-width centered container).

---

## 2. Typography Lock & Hierarchy

*No arbitrary font family or font size outside this table is permitted.*

* **Heading Font:** `Inter` (`font-sans`, weights `600`, `700`)
* **Body Font:** `Inter` (`font-sans`, weights `400`, `500`)
* **Amounts & Currencies:** `Inter` with mandatory `tabular-nums` (`font-variant-numeric: tabular-nums`) so `FCFA` and `Sats` columns align vertically without jitter.
* **Code / Monospace (Invoices & `npub` only):** `JetBrains Mono` (`font-mono`, weight `400`, `500`)

| Element | Tailwind Classes / CSS Rules | Desktop Size | Mobile Size | Line Height | Usage Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Amount Hero** | `text-2xl md:text-4xl font-bold tracking-tight tabular-nums` | 36px | 24px | 1.15 | Pot total in `FCFA` & `Sats` |
| **H1** | `text-xl md:text-2xl font-bold tracking-tight` | 24px | 20px | 1.25 | Page title (one per screen) |
| **H2** | `text-base md:text-lg font-semibold tracking-tight` | 18px | 16px | 1.3 | Card headers, Round headers |
| **H3** | `text-sm md:text-base font-semibold` | 16px | 14px | 1.4 | Member row titles, modal headers |
| **Body (Default)** | `text-sm font-normal leading-relaxed` | 14px | 14px | 1.5 | Descriptions, rules, ledger rows |
| **Body (Input)** | `text-base md:text-sm` | 14px | 16px* | 1.4 | Form inputs (*16px prevents mobile zoom) |
| **Muted / Caption** | `text-xs text-muted-foreground` | 12px | 12px | 1.4 | Timestamps, `Sats` subtitle, `npub` preview |

---

## 3. Immutable Semantic Color Tokens

*Components must NEVER use raw hex (`#fff`) or arbitrary classes (`bg-[#123456]`). Use these semantic tokens:*

| Token Name | CSS Variable | Light Mode Value | Dark Mode Value | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| `background` | `--background` | `#F8FAFC` (Slate 50) | `#0F172A` (Slate 900) | Global canvas background |
| `foreground` | `--foreground` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Primary text and headings |
| `card` | `--card` | `#FFFFFF` (White) | `#1E293B` (Slate 800) | Surface for circle cards, member rows, modals |
| `card-foreground` | `--card-foreground` | `#0F172A` (Slate 900) | `#F8FAFC` (Slate 50) | Text inside cards |
| `border` | `--border` | `#E2E8F0` (Slate 200) | `#334155` (Slate 700) | 1px hairline dividers and outlines |
| `primary` | `--primary` | `#0F2942` (Trust Navy) | `#38BDF8` (Sky 400) | Main CTA buttons, active round indicator |
| `primary-foreground`| `--primary-foreground` | `#FFFFFF` (White) | `#0F172A` (Slate 900) | Text on primary button |
| `secondary` | `--secondary` | `#F1F5F9` (Slate 100) | `#334155` (Slate 700) | Secondary actions, language pills |
| `muted-foreground` | `--muted-foreground` | `#475569` (Slate 600) | `#94A3B8` (Slate 400) | Secondary conversion (`≈ Sats`), helper text |
| `success` | `--success` | `#047857` (Emerald 700)| `#10B981` (Emerald 500)| Settled payment badge, verified Nostr receipt |
| `warning` | `--warning` | `#B45309` (Amber 700) | `#F59E0B` (Amber 500) | Pending invoice, due soon indicator |
| `destructive` | `--destructive` | `#B91C1C` (Crimson 700)| `#EF4444` (Red 500) | Missed/overdue payment, invalid input |

---

## 4. Spacing, Geometry & Elevation

* **Grid & Density:** Balanced Mobile Precision (`12px–20px` card padding, `12px` vertical stack gap, single-column mobile layout expanding to a 12-column 2-pane layout on `md:` desktop).
* **Corner Radius:** `rounded-lg` (`8px`) for cards, inputs, and buttons; `rounded-full` for status pills.
* **Touch Targets (UI-UX-Pro-Max):** Minimum clickable boundary is **44×44px** (`min-h-[44px] min-w-[44px]`) on all interactive controls (pay buttons, copy buttons, persona switchers, language toggles).
* **Elevation & Borders:**
  * Base cards: `border border-border bg-card shadow-xs`
  * Active beneficiary card: `border-2 border-primary bg-card`
  * Modals / Sheets: `border border-border bg-card shadow-lg`
* **List Surfaces (`docs/LIST_SURFACE_PRINCIPLES.md`):**
  * A repeated item drawn as its own surface (card, rounded row, filled block) uses that surface's edge as its boundary and must **not** also carry a hairline separator. Hairline separators are for flat lists only (the Settings screen).
  * The vertical gap between a section label and the control or list it labels is one token, `--gap-label-to-control: 12px`, applied on every screen.
  * Navigation and action icons use the platform convention for their destination (settings = gear, notifications = bell, copy = overlapping squares, back = left chevron), from one icon family at one stroke weight.

---

## 5. Interaction, Motion & Micro-Graphics

> **AMENDED 2026-11-07 (user direction): the interface is motion-rich.** The previous “Low-Motion” tier is retired. Full choreography, tokens, reduced-motion matrix and performance budget: [`MOTION_REFERENCES.md`](MOTION_REFERENCES.md).

* **Motion Tier:** **Rich, budgeted** — expressive at six signature moments (round ring fill, amount roll, NWC three-stage payment, success burst, receipt timeline, passport stamp); productive everywhere else.
* **Tokens (mandatory):** durations `90 / 140 / 200 / 280 / 400 / 800ms`; easings `--ease-standard`, `--ease-enter`, `--ease-exit` from Material 3. No ad-hoc durations or curves inside components.
* **Budget:** animate `transform` and `opacity` only; ≤ 3 concurrent animations per screen; motion JS ≤ 45 KB gzip; no Lottie or Rive in the first paint; no long task over 50 ms during a transition.
* **Accessibility:** every effect has a `prefers-reduced-motion` fallback, plus an in-app “Réduire les animations” setting. No large-area scaling or panning for vestibular safety.
* **Banned:** scroll-jacking, parallax, looping decorative motion on the dashboard, fake progress percentages, elastic motion on money amounts, and page transitions over 400 ms.
* **Hover states are desktop-only.** Every action stays visible and tappable on mobile without hovering.
* **Icons:** SVG icons ONLY (`lucide-react`). Text emojis are strictly banned inside UI components. Every icon-only button must include an explicit `aria-label`.

---

## 6. Mandatory 4-State UI Contract

Every component, card, form, or route must implement:

1. **Default (Idle):** Clear hierarchy showing `FCFA` primary amount, `EUR`/`Sats` secondary equivalent, and explicit member status pill (`Payé` / `En attente` / `En retard`).
2. **Hover / Focus:**
   * Visible keyboard focus ring: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`.
   * All actions must be directly visible on mobile without hovering.
3. **Loading / Pending:**
   * NWC payment and invoice buttons disable immediately on click and show an SVG spinner + `"Règlement Lightning en cours..."`.
   * Ledger cards render fixed-height skeleton placeholders (`bg-secondary animate-pulse rounded-lg h-16`) so `CLS < 0.1`.
4. **Empty & Error States:**
   * Empty circle state includes an SVG icon, explanation, and `"Créer une tontine"` or `"Charger la démo (Dakar ↔ Paris)"` CTA.
   * Failed NWC or invoice verification shows an inline high-contrast `text-destructive` banner with a 1-tap fallback to manual BOLT11 QR payment.

---

## 7. Karpathy Coding Guidelines for Frontend AI

All AI coding agents writing code for this project must obey:

1. **Think Before Coding:** State mobile viewport (`375px`) and semantic token usage before writing components.
2. **Simplicity First:** No speculative props, no unrequested dark-mode animations, no complex state libraries where React state + fetch suffices.
3. **Surgical Edits:** Modify only the files requested.
4. **Clean Own Orphans:** Remove unused imports immediately.
5. **Verifiable Checks:**
   - [ ] Zero hardcoded `#hex` or `rgb()` outside global CSS token declarations.
   - [ ] All currency/satoshi numbers use `tabular-nums`.
   - [ ] All buttons and icon controls meet `min-h-[44px]`.
   - [ ] Tested at `375px` width with zero horizontal overflow.
   - [ ] Default, Loading, Empty, and Error states verified for Circle, Payment, and Reputation views.
   - [ ] No card or rounded row also carries a hairline separator; every label→control gap uses `--gap-label-to-control`; navigation icons use platform conventions from one icon family.
