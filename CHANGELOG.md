# Changelog

All notable changes to the specification, research knowledge base, and implementation of **TontineSats** are documented in this file.
Format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
### Added
- Landing hero: a quiet `Démo` button right of `Rejoindre une tontine`, opening a sandbox session (throwaway keypair, test wallets) with the disclosure line beneath it. The demo entry now lives in `src/lib/useDemoEntry.ts`, shared with the entry card so both land in the same state.
- Legal documents at `/legal/terms` and `/legal/privacy`: French text with an English toggle that leaves the app language alone, version 1.0 effective 9 November 2026, served from `src/content/legal/` and mirrored in `docs/LEGAL.md`. Unknown document ids redirect home.
- Consent gate with two separate unticked boxes on `/auth` and again on the Auth profile step, so deep links into `?mode=create` cannot skip it. Acceptance is stored as `legalConsent` (version, timestamp, locale) on the session. The demo entry stays open and says it uses test wallets.
- `ThemeToggle`: 44px labelled sun/moon button, in the landing header and in the login page's wordmark row.
- `scripts/shots.mjs` and `scripts/e2e.mjs` (`npm run shots`, `npm run check:ui`) for screenshots and DOM checks across themes, both widths, and the legal routes.

### Changed
- Landing: sign up and log in now sit in the header from 768px, with the hero carrying create, join, and a phone-only log in link. The landing canvas is paper in light and navy in dark, both driven by the shared theme setting, and the dot field recolours when the theme changes.
- Login page: the do and do-not grid is gone, replaced by the consent gate plus a one-line non-custody disclosure linking both documents.

### Fixed
- `npm run check:ui` never called `Page.enable`, so its `localStorage` seeding was accepted and silently ignored: every page kept whatever state the previous test left behind, and the theme checks passed on leftover values. The script now enables the domain, stamps a `window.__seeded` flag, and refuses to pass a page that was not seeded.
- Back from the identity wizard went to `/auth`, the separate entry card, so leaving "log in" or "create identity" never returned to the landing page. The wizard's back control now follows browser history and falls back to `/` when the page was opened from a direct link. It is also a full 44px target now.

- Landing is now a generated dot field instead of a flat navy poster: 20px pitch on desktop (15px on phones), brand-tinted accent dots, and a local pointer magnification (radius 160px, max 1.9× dot size, 8px displacement, eased pointer, 2.5s rest, damped over text and cards). No photo, no runtime asset. Reduced motion and touch get the static field. Glass panels use `glass-veil` (64px blur, smoked surface at 62%) plus a light sheen.
- Glass is stronger: panels 48px (was 20), chrome and sheets 56px (was 26); light tint 40/50/42% and dark 56/64/48%; the app mesh runs at 64/54/44% in light and 52/46/34% in dark, with a 5% noise layer and a 9% dot grid. Text contrast was re-measured after the change.
- Dashboard opens with a full-width member card (avatar, npub copy, member since, Verified, on-time %, receipts, invite pill). The eye moved into the navy card's top-right and still hides every amount globally; `Tour 3 / 8` replaces the "Cagnotte du tour" label; the round chip is gone and the remaining two chips moved inside the card. Payout order stays full width below.
- Sidebar: collapse to a 72px icon rail, drag-resize 208–344px, double-click reset, arrow-key resize, width and state persisted. The identity footer, invite, and sign-out left the sidebar; sign-out now lives in Settings.
- Rings: one shared eased 700ms clock drives the arc and the number. Dashboard 0 → 192 000 FCFA with five member arcs; Passport 0 → on-time %. The old separate count-up and CSS transition are gone.
- Calendar: every day is a 44px circle with a soft surface; the header opens a scrollable 2015–2035 year/month picker with the selected month marked, free previous/next arrows, Escape and outside-click close, and focus return. Activity now filters receipts by the visible month and shows an honest empty month.

### Added
- Web app in `src/` (React 19 + Vite 8 + TypeScript + Tailwind v4): responsive shell with a desktop sidebar and a mobile tab bar, landing/login, NIP-06 identity onboarding, dashboard, activity calendar, passport, receipt, settings, payment sheet, and invite/join flows.
- Identity: real BIP39 12-word backup with NIP-06 derivation, `nsec` import, NIP-07 extension login, and a demo session. Session and settings persist locally.
- PWA manifest, app icon, and shell service worker (production only).
- Screenshots in `shots-web/` (29 images, including the dot-field landing, dark and mobile variants, the member card, the sidebar rail, the month picker, and the mobile activity calendar) and a root `README.md` covering the web app.
- Interactive HTML prototype in `prototype/` (dashboard, payment sheet with NWC/QR flows, receipt, reputation passport, activity, join, settings), with FR/EN/WO, light/dark themes, reduced motion, persona switcher, and three recorded motion clips.
- Scripted click-through at 375×667 and 390×844: 30/30 steps, zero exceptions, zero horizontal overflow.
- `docs/LIST_SURFACE_PRINCIPLES.md`: three locked rules for list surfaces (surface instead of a stacked separator), label-to-control gap consistency, and platform-convention icons. Encoded into `AGENTS.md` §2A, `docs/DESIGN_PRD.md` §4, and the auditor checklist.
- Motion reference catalog in `docs/MOTION_REFERENCES.md`: Material 3 / Carbon / Spectrum 2 tokens, per-screen choreography, a button micro-motion table, reduced-motion matrix, performance budget, and the six signature demo moments.
- Wiki page `motion-references` and raw source notes `research/raw/motion-sources.md`.
- Design reference catalog in `docs/DESIGN_REFERENCES.md`: 20 App Store screenshot sets plus GOV.UK design system pages inspected, mapped screen by screen, with a 30-item micro-detail library and a “what not to copy” list.
- Curated reference screenshots in `docs/assets/design-refs/` (14 images, internal study only).
- Wiki pages `design-references`, `sol-app`, `susu-app`, `daret-app` under `research/wiki/`, plus raw source notes in `research/raw/design-sources.md`.

### Added
- Glassmorphism surface system: `glass-chrome` (sidebar, mobile header, tab bar, sheets), `glass-panel` (sections), and `glass-flat` (repeated rows and chips) utilities with tinted blur, inner highlight, and a brand mesh canvas (emerald/sky/sand) plus a faint dot texture. Landing preview card and language switch gained backdrop blur; `/join` uses the mesh. `/auth*` stays solid by design. Solid fallbacks for browsers without `backdrop-filter`, `prefers-reduced-transparency`, and print. Dark muted text lifted to `#A3B0C2` to hold contrast on the brightest glass.

### Fixed
- Landing colour mismatch: the page painted itself with `bg-primary`, which is the sky-blue accent (`#38BDF8`) in dark theme and a flat `#0F2942` in light, while the dashboard pot card uses `--hero-surface`. The landing now uses the same `--hero-surface` / `--hero-ink` tokens as the dashboard, so both render `#0F2942` in light and `#213B52` in dark. The in-page radial highlights were converted to `hero-ink` mixes for the same reason.

### Changed
- Entry is now two pages: `/` is a standalone landing (hero, pot preview, FR/EN/WO switch, sign-in and join CTAs), and `/auth` holds the identity entry card (create, import, extension, demo). `?mode=` still opens the matching form, so join links and the create/import deep links are unchanged. The chosen language persists across both pages.
- Prototype revision: removed the toast and the duplicate demo bar, moved the Verified stamp into the passport header, converted ledger rows to full-width cards without separators, animated method cards, added a gear icon, widened the settings label gap, removed the Motion heading, and enlarged the hero ring.
- Activity calendar is now interactive (month navigation, day filtering, empty-day state), and rotation rows open a member sheet with contextual actions.
- Payout-order rows use the same card treatment as Activity history rows (bordered, rounded, 8px apart, no separators).
- `docs/DESIGN_PRD.md` §5 amended: motion tier upgraded from “Low-Motion” to “rich, budgeted”, with mandatory tokens, performance limits and banned patterns.

### Planned
- Milestone 1 (P0): Fullstack TypeScript MVP (React + Vite PWA, Hono API, SQLite/Drizzle, NWC auto-pay, BOLT11 QR fallback, Nostr co-signed reputation receipts, and 1-click Dakar ↔ Paris judge simulation).
- Milestone 2 (P1): Trilingual UI (`Français`, `Wolof`, `English`) and overdue reminder templates.

## [0.1.0] - 2026-11-07
### Added
- Completed `/prd-architect` end-to-end discovery interview and locked product specifications in `docs/PRD.md`.
- Locked Frontend Visual Constitution in `docs/DESIGN_PRD.md` (FinTech Softened archetype, `Inter` + `JetBrains Mono`, semantic color tokens, 44px touch targets, low-motion tier).
- Created Karpathy LLM Research Wiki in `research/` covering Dakar Bitcoin Hack rules, academic ROSCA/tontine literature, World Bank Findex/remittance data, and competitor teardown (`MaTontine`, `Zepargn`, `Kolonell`).
- Generated interactive knowledge graph in `research/.ua/knowledge-graph.json` via `/understand-knowledge` (30 nodes, 79 edges, 6 layers, 5 tour steps).
- Added root `AGENTS.md` and `REFERENCES.md`.
