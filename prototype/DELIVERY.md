# Delivery gate

antislop mode: **during**. Run date: 2026-11-07. Scope: `prototype/` (HTML, CSS, JS).

## Block 1: Hard Gate

| Rule | Status | Evidence |
| :--- | :--- | :--- |
| R-02 em dash | PASS | Regex scan over `prototype/**/*.{html,css,js,md}`: 0 matches for U+2014. |
| R-03 mobile overflow | PASS | CDP at 375×667: `scrollWidth = 375 = viewport`, no clipping; 390×844 same. |
| R-17 fake statistics | PASS | No user counts, uptime, or percentages presented as real. Demo values are from the PRD and labelled. |
| R-18 fake testimonials | PASS | None. |
| R-23 unconfirmed assets | PASS | Avatars are initials, not photos; no logos or brand marks; QR is labelled "QR de démonstration". |
| R-24 dead navigation | PASS | 4 tabs + 6 routes all resolve to existing views (click-through 22/22). |
| R-25 contrast | PASS | Token pairs: ivory on navy ~14:1; slate-600 on slate-50 ~7:1; emerald-700 on white ~5:1; amber-700 ~4.6:1; sky-400 on slate-900 ~9:1. |
| R-26 dead controls | PASS | Every button has a handler; scripted click-through exercises tabs, sheets, methods, pay, QR, copy, join, replay, theme, language, reduced motion, Escape, calendar days, month navigation, and the member sheet. |
| R-27 states | PASS | Loading: boot skeleton. Empty: post-join activity. Error: QR invoice expiry with retry. |
| R-28 FAQ | PASS | No FAQ. |
| R-32 keyboard | PASS | Visible `:focus-visible` ring; Escape closes sheets; Tab is trapped inside an open sheet; tested. |
| R-33 script patching | PASS | All behaviour written in `app.js` / `styles.css`; no runtime file rewriting. |
| R-34 themes | PASS | Light and dark screenshots; both verified after the dark-hero correction. |
| R-35 run + click-through | PASS | 30/30 steps, 0 exceptions at 375×667 and 390×844. |
| R-36 fabricated claims | PASS | No security/compliance/performance claims. |
| R-37 direction | PASS | Direction from `docs/DESIGN_PRD.md` + `docs/MOTION_REFERENCES.md`; dials declared (ENERGY 2 / RHYTHM 2 / MOTION 3). |
| R-38 fabricated content | PASS | Demo personas/amounts come from the PRD; Settings states the balances are not real. |

## Block 2: Purpose-Gate

| Rule | Status | Reason |
| :--- | :--- | :--- |
| R-01 colour/gradient | PASS | One navy hero surface; the only gradient is a low-alpha radial used to lift the hero as the single focal point. No blue-purple/AI gradient. |
| R-04 icons | PASS | Bolt = Lightning rail, shield = signed proof, QR = QR payment, lock = locked rate. Stroke set follows the locked `lucide-react` direction. |
| R-06 typography | PASS | Inter for UI, tabular figures for money, JetBrains Mono for hashes/`npub`/codes · mandated by `DESIGN_PRD`. |
| R-07 background | PASS | No grid/blueprint pattern. |
| R-08 arrows | PASS | No decorative arrows; chevrons only on disclosure controls. |
| R-09 badges | PASS | `Conseillé` and status pills: real state/context, no glow/dot combo. |
| R-10 glass | PASS | None. |
| R-12 shadow | PASS | Cards use a 1px hairline plus one subtle shadow; the sheet is the only strongly elevated surface. |
| R-13 glow | PASS | No glow. |
| R-14 feature cards | PASS | Hero, action card, ledger rows and stats differ by content role. |
| R-19 animation | PASS | Six signature moments, all with a written UX purpose in `MOTION_REFERENCES.md`; dial MOTION 3; no endless pulses except the QR waiting dot (functional, stops on close/expiry). |
| R-22 illustration | PASS | No illustrations. |

## Block 3: Liveliness

| Item | Status | Evidence |
| :--- | :--- | :--- |
| Dials declared | PASS | ENERGY 2 / RHYTHM 2 / MOTION 3 in the build note. |
| Consistent with dials | PASS | App shell is consistent; the six expressive moments carry the motion. |
| Focal point per screen | PASS | Hero ring (dashboard), amount (pay), check (paid), gauge (passport). |
| Whitespace structural | PASS | 20px page rhythm, 22px section rhythm, larger gaps around the hero. |
| One deliberate accent | PASS | Semantic accents only (amber due, emerald paid); navy for action. |
| Identity motif | PASS | Segmented round ring repeated in pot, progress and passport. |
| Design Read before generation | PASS | Declared in the build turn. |

## Block 4: Craftsmanship & Quality Locks

| Rule | Status | Evidence |
| :--- | :--- | :--- |
| C-1 intentionality | PASS | Every token pair and animation has a documented reason. |
| C-2 functional completeness | PASS | 22/22 controls exercised; no dead button. |
| C-3 content-driven | PASS | Screens map to PRD features 1.1–1.5, 2.1–2.2; no template sections. |
| C-4 resilience | PASS | Empty/loading/error states; both themes; 375 and 390 widths; keyboard. |
| C-5 evidence | PASS | No claim goes beyond the PRD or the sources; prototype labelled. |
| R-05 layout | PASS | App surface, not a landing template; no bento/pricing/logo bar/terminal. |
| R-11 radius | PASS | 8/10/12/16/24/999 used by role, not everything pill. |
| R-15 CTA | PASS | "Payer 24 000 FCFA", "Rejoindre la tontine", "Voir le reçu" · action-specific. |
| R-16 buzzwords | PASS | No AI/seamless/revolutionary copy. |
| R-20 identity | PASS | Navy/slate, tabular money, ring motif; not a clone of a named product. |
| R-21 dark mode | PASS | Working toggle with system mode; both themes verified. |
| R-29 palette | PASS | Navy, slate neutrals, semantic emerald/amber/crimson accents only. |
| R-30 cloning | PASS | Pattern references only (SUSU, Wise, Blink), not a visual clone. |
| R-31 reasons | PASS | Written in `prototype/README.md` and `docs/MOTION_REFERENCES.md`. |

## Result

**PASS.** 30/30 click-through steps, 0 console exceptions, 0 horizontal overflow at 375×667 and 390×844.
