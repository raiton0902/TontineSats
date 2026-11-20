# References, Research Sources & Design Tokens

This document records the academic research, competitor teardowns, protocol specifications, libraries, and UI references underpinning **TontineSats**.

---

## 1. UI & Visual References

Full per-screen specs, micro-details, and a “what not to copy” list: [`docs/DESIGN_REFERENCES.md`](docs/DESIGN_REFERENCES.md). Screenshot evidence collected 2026-11-07.

| Element / Screen | Reference Source | Specific Detail Borrowed |
| :--- | :--- | :--- |
| **Product direction (non-custodial circles)** | SÒL — Savings Circles ([App Store](https://apps.apple.com/app/id6792436901)) | “Your next moves” single-action card, member due card, organizer proof review, Trust Passport layout |
| **Circle dashboard & rotation** | The SUSU App ([App Store](https://apps.apple.com/app/id6748971171)) | `R1…RN` payout order rows with `Received` / `This round` / `Waiting` pills; segmented `4 paid · 2 to go` bar; sticky contribute CTA |
| **Contribution sheet (diaspora)** | Wise ([App Store](https://apps.apple.com/app/id612261027)) | Locked-rate chip, `You send` / `They get` pair, breakdown rows with `Change` disclosure |
| **CFA-first amount display** | Blink POS ([App Store](https://apps.apple.com/app/id1531383905)) and Phoenix ([App Store](https://apps.apple.com/app/id1544097028)) | Amount hero with `≈ sats` subtitle; `sat ⇅` unit toggle; fee disclosure line |
| **Organizer ledger** | Splitwise ([App Store](https://apps.apple.com/app/id458023433)) and Tricount ([App Store](https://apps.apple.com/app/id349866256)) | Three-state `you owe` / `you are owed` / `settled up` summary; pill-shaped ledger rows with payer subtitle |
| **Local FCFA vernacular** | Wave (SN), Djamo (CI), Zepargn (BJ) | Balance-first header with eye toggle, signed amounts in history, explicit fee line, goal progress bars |
| **Status tags & busy buttons** | GOV.UK Design System | Tags are status only and never interactive; never colour alone; avoid disabled primaries, show a spinner instead |
| **Reputation Passport** | GitHub Contributions / Verifiable Credentials | Dense list of proofs linking each completed round to its signed receipt, not a composite score |

*Previously cited and not re-verified in the 2026-11-07 pass: Stripe Dashboard (semantic status pills with `tabular-nums` alignment). Treat as an open item until someone opens it.*

---

## 2. Protocol & Library References
| Category | Library / Standard | Documentation / Link | Usage Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + Vite + Tailwind CSS | https://vitejs.dev | Fast PWA bundle for budget Android devices |
| **Backend Server** | Hono (Node.js) | https://hono.dev | Lightweight TypeScript router with zero bloat |
| **Database & ORM** | SQLite + Drizzle ORM | https://orm.drizzle.team | Type-safe relational schema matching the 5-table ERD |
| **Nostr Protocol** | `nostr-tools` (NIP-01, NIP-07) | https://github.com/nbd-wtf/nostr-tools | Key generation, event signing, and receipt verification |
| **Automated Payments** | Alby SDK / NIP-47 (NWC) | https://github.com/getAlby/js-sdk | Nostr Wallet Connect budget-authorized recurring pulls |
| **Lightning Sandbox** | LNbits REST API | https://lnbits.com | Instant demo wallets and BOLT11 invoice generation |
| **Icons** | `lucide-react` | https://lucide.dev | Accessible SVG icons (no text emojis) |
| **Motion engine** | Motion (`motion/react`) | https://motion.dev | Springs, enter/exit, layout and drag; `LazyMotion` keeps the bundle small |
| **Bottom sheet** | `react-modal-sheet` | https://github.com/temzasse/react-modal-sheet | Drag physics, snap points, velocity dismiss, built-in reduced-motion prop |
| **Animated amounts** | NumberFlow | https://number-flow.barvian.me | Digit rolling for FCFA and sats figures without layout shift |
| **Celebration** | `canvas-confetti` | https://github.com/catdad/canvas-confetti | One-shot success burst with `useWorker` and `disableForReducedMotion` |
| **Toasts** | Sonner | https://sonner.emilkowal.ski | Toast stacking and exit motion |

---

## 3. Domain Research & Competitor Analysis
*(Full structured wiki available in [`research/wiki/index.md`](research/wiki/index.md))*

- **Dakar Bitcoin Hack (Btrust on Devpost):** https://dakar-bitcoin-hack.devpost.com/ — Prioritizes local Senegalese usefulness, open-source code, and working Bitcoin/Lightning wallet integration.
- **World Bank Global Findex (Senegal):** 56% adult account ownership (heavily mobile money), while formal banking credit remains inaccessible to informal workers.
- **World Bank Remittance Prices Worldwide:** Sub-Saharan Africa averages >8% remittance cost; France-to-Senegal corridor averages ~3–5% plus MTO/mobile-money cash-in friction.
- **Competitor Teardown:**
  - **MaTontine:** Custodial via partner microfinance institutions (COFINA) under BCEAO regulation; monetizes proprietary credit scores via B2B loan commissions.
  - **Zepargn:** Custodial via AVM (regulated SFD in Benin/WAEMU); charges 5% capital penalty on early `Z-Lock` withdrawals.
  - **Kolonell:** Agency building custom Wave/Orange Money domestic tontine apps.

---

## 4. Motion & Animation References

Full choreography per screen, tokens, reduced-motion matrix and performance budget: [`docs/MOTION_REFERENCES.md`](docs/MOTION_REFERENCES.md).

| Topic | Reference Source | Specific Detail Borrowed |
| :--- | :--- | :--- |
| **Duration and easing tokens** | [Material 3 motion tokens](https://m3.material.io/styles/motion/overview) | 50–1000ms scale; emphasized / accelerate / decelerate curves |
| **Productive vs expressive motion** | [IBM Carbon motion](https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview) | 70/110/150/240/400ms slots; expressive only for significant moments; 90–120ms micro-interaction guidance |
| **Directional meaning** | [Adobe Spectrum 2 motion](https://spectrum.adobe.com/page/motion/) | Linear = progress, diagonal = context switch, clockwise = waiting; button down-state scaling |
| **Motion craft rules** | [Emil Kowalski — Great Animations](https://emilkowal.ski/ui/great-animations) | Under 300ms, ease-out, never animate repeated actions, transform/opacity only, interruptibility |
| **Gesture physics** | [Rauno Freiberg — Invisible Details](https://rauno.me/craft/interaction-design) | Intent thresholds, momentum, spatial consistency, fluid morphing |
| **Accessibility** | [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) | Reduced-motion fallback for every effect; vestibular risk of large scaling |
| **Route transitions** | [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Shared-element transition for dashboard → receipt |
