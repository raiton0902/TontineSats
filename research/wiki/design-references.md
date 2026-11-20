---
type: reference
status: verified
---
# Design References

Apps and sites worth copying a screen, a component, or a single control from. Full catalog with per-screen specs: [`docs/DESIGN_REFERENCES.md`](../../docs/DESIGN_REFERENCES.md). Sources: [`research/raw/design-sources.md`](../raw/design-sources.md).

## How this was gathered
App Store screenshot sets for 20 apps were opened and inspected on 2026-11-07, plus the GOV.UK design system and four product pages. Claims marked **Verified (screenshot)** were seen; **Verified (doc)** comes from official text. Nothing here is from memory.

## The three closest analogs
| App | Model | Why it is close |
|---|---|---|
| [[sol-app]] | Non-custodial savings circle: members pay each other, app keeps records and reviews proofs | Closest to [[tontinesats]] in philosophy |
| [[susu-app]] | Rotating circle, fixed order, one payout per round | Closest in screens: circle dashboard, contribute sheet, payout receipt |
| [[daret-app]] | Tontine by invite code, organizer confirms, gauge fills | Closest in invite and rotation wording |

**Verified (screenshot):** all three present the rotation as a vertical list with one highlighted row, not a ring. That contradicts the ring-first assumption in the PRD and supports list-first on mobile.

## What to take, by screen
- **Circle dashboard:** SUSU's `R1…RN` payout order with `Reçu` / `Ce tour` / `En attente` pills, and its segmented `4 paid · 2 to go` bar.
- **Payment sheet:** Wise's locked-rate chip and `You send / They get` pair; Blink POS amount over a sats subtitle; Phoenix's `sat ⇅` toggle.
- **Receipt:** SUSU's payout timeline. Four steps with timestamps map one-to-one onto invoice, payment, preimage, and signed Nostr receipt ([[technical-building-blocks]]).
- **Reputation:** SÒL's Trust Passport layout, but with verifiable counts instead of a `92/100` score. A proprietary score would contradict [[differentiators]].
- **Organizer ledger:** Splitwise's three-state `you owe` / `you are owed` / `settled up` summary and Tricount's row shape.
- **Local tone:** Wave and Djamo for FCFA amount treatment; Zepargn for group-savings wording in French.

## What not to copy
- Custodial trust badges (`regulated by the central bank`) from [[matontine]]-style apps and Money Fellows. Our trust object is a co-signed receipt.
- MaTontine's flag-based language picker: Wolof has no flag.
- Confetti, full-bleed photography, and “no fees” claims.

## Corrections this research forces
- `docs/DESIGN_PRD.md` lists a “rotation ring”; the evidence favours a list with the ring as a `md:` decoration.
- Amount separators differ across Senegal-facing apps (`10 000` vs `250.000`). Keep the PRD's space and test on Android WebView.
- Blink Circles is a referral tracker, not a savings product. Do not cite it as a competitor or a ROSCA reference.

## Related
[[tontinesats]], [[differentiators]], [[zepargn]], [[matontine]], [[technical-building-blocks]]
