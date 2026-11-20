# Motion Sources

Raw notes for the motion reference search. Created 2026-11-07. Do not edit after creation.

## Method
- Official motion specs fetched as text (Material token file, Carbon, Spectrum 2, MDN).
- Motion engineering essays fetched in full (Emil Kowalski, Rauno Freiberg).
- Library READMEs fetched from GitHub (Motion docs, react-modal-sheet, canvas-confetti, NumberFlow, Sonner).
- Apple HIG and Material 3 UI pages render client-side, so their body text did not come through; the Material values were taken from the published token file instead.

## Extracted values

### Material 3 (token file v0.192)
- Durations: short1 50, short2 100, short3 150, short4 200, medium1 250, medium2 300, medium3 350, medium4 400, long1 450, long2 500, long3 550, long4 600, extra-long1 700, extra-long2 800, extra-long3 900, extra-long4 1000ms.
- Easings: emphasized `cubic-bezier(0.2, 0, 0, 1)`; emphasized-accelerate `(0.3, 0, 0.8, 0.15)`; emphasized-decelerate `(0.05, 0.7, 0.1, 1)`; standard-accelerate `(0.3, 0, 1, 1)`; standard-decelerate `(0, 0, 0, 1)`; legacy `(0.4, 0, 0.2, 1)`; linear `(0, 0, 1, 1)`.

### IBM Carbon
- Productive standard `cubic-bezier(0.2, 0, 0.38, 0.9)`; expressive standard `cubic-bezier(0.4, 0.14, 0.3, 1)`.
- Productive exit `cubic-bezier(0.2, 0, 1, 0.9)`; expressive exit `cubic-bezier(0.4, 0.14, 1, 1)`.
- Duration tokens: fast-01 70, fast-02 110, moderate-01 150, moderate-02 240, slow-01 400, slow-02 700ms.
- Evaluation checklist: purposeful, responsive (90–120ms micro-interactions, ease-out on input), meticulous, unobtrusive. Notes that subtle motion is easily missed on mobile screens.

### Adobe Spectrum 2
- Direction categories: linear (progress), diagonal (context switch), clockwise (holding/waiting).
- Button scales down on the down state; arrow icons move on hover; arrow motion “sparingly, only on the most important action”.
- Motion over large surfaces must support reduced-motion settings.

### MDN
- `prefers-reduced-motion: reduce`; large scaling/panning animations are vestibular triggers.
- View Transition API: SPA + MPA transitions, `view-transition-name`, `::view-transition-*` pseudo-elements, `Document.startViewTransition()`.

### Emil Kowalski, “Great Animations”
- Natural motion (springs), fast (sub-300ms, `ease-out`), purposeful (consider frequency; never animate keyboard-initiated actions), performant (`transform`/`opacity`; CSS/WAAPI when the main thread is busy), interruptible, accessible, and tuned by feel.
- Vercel dashboard tab animation: shared-layout animation dropped frames, fixed by moving it to CSS.

### Rauno Freiberg, “Invisible Details of Interaction Design”
- Gesture intent thresholds; lightweight actions trigger mid-gesture, destructive ones on release.
- Momentum and angle retained after a throw; interruptible transitions; spatial consistency; fluid morphing of shapes.

### react-modal-sheet
- Defaults: tween `{ ease: 'easeOut', duration: 0.2 }`, `dragVelocityThreshold: 500`, `dragCloseThreshold: 0.6`.
- `prefersReducedMotion` prop snaps instantly; `snapPoints`; iOS modal effect scales the app behind; `avoidKeyboard` via Virtual Keyboard / Visual Viewport API.
- `vaul` (an alternative sheet library) states in its README that it is unmaintained; `react-modal-sheet`'s README carries no such notice as of 2026-11-07.

### canvas-confetti
- `disableForReducedMotion` (default false), `useWorker` to move rendering off the main thread, `particleCount` default 50, `spread` 45, `startVelocity` 45, `ticks` 200.

### NumberFlow
- Animated number component for React/Vue/Svelte/TS. Documentation at number-flow.barvian.me.

## Not verified
- Apple HIG motion specifics (page is client-rendered; not read).
- Any timing taken from a named consumer app (Cash App, Revolut, Monzo, Duolingo, Linear). Those were not measured; the catalog does not cite their timings as fact.
- Haptic support in iOS Safari (believed unsupported; not tested here).
