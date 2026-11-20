---
type: reference
status: verified
---
# Motion References

Motion direction for the app, replacing the old “Low-Motion” tier in `docs/DESIGN_PRD.md` §5. Full per-screen choreography, tokens, reduced-motion matrix and budgets: [`docs/MOTION_REFERENCES.md`](../../docs/MOTION_REFERENCES.md). Sources: [`research/raw/motion-sources.md`](../raw/motion-sources.md).

## Position
Motion-rich, but budgeted. Six signature moments carry the demo; everything else uses fast, quiet, productive motion. **D** (our decision, built on the sources below).

## Tokens (Verified)
Material 3 tokens: durations `50–1000ms`, easings `cubic-bezier(0.2,0,0,1)` (standard), `(0.05,0.7,0.1,1)` (emphasized decelerate), `(0.3,0,1,1)` (accelerate). Carbon's productive slots are `70/110/150/240/400/700ms`. **(Verified, official specs)**

Our working set: `90 / 140 / 200 / 280 / 400 / 800ms` with the three M3 curves.

## Rules worth remembering
- Under **300ms** for UI, `ease-out` on user input, **90–120ms** for button-level feedback. (Verified, Emil Kowalski + Carbon)
- Never animate repeated or keyboard-initiated actions. (Verified)
- Animate `transform`/`opacity` only; CSS over JS when the main thread is busy. (Verified)
- Motion must be interruptible and spatially consistent. (Verified, Rauno)
- Every effect needs a reduced-motion fallback. (Verified, MDN)
- No fake progress; clockwise is reserved for waiting. (Verified, Spectrum)

## The six signature moments
1. Round ring fills as contributions confirm.
2. Sats amount rolls when the rate locks.
3. NWC auto-pay, three real stages.
4. Payment success: check draw plus one confetti burst.
5. Receipt timeline fills with proof.
6. Reputation passport stamps and counts up.

## Corrections to the PRD
- `DESIGN_PRD` §5 said Low-Motion, 150ms, no decorative animation. Amended 2026-11-07: rich motion is allowed, with a hard budget (≤ 45 KB motion JS, ≤ 3 concurrent animations, no first-paint Lottie/Rive).
- The PRD's `motion-reduce:transition-none` is not enough on its own; each effect needs a defined fallback (see the matrix in the catalog).

## Related
[[tontinesats]], [[design-references]], [[technical-building-blocks]]
