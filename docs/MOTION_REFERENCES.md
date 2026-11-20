# Motion Reference Catalog: TontineSats

> **STATUS:** Active direction. Amends `docs/DESIGN_PRD.md` §5 (the old “Low-Motion” tier is retired).
> **QUESTION:** What motion should each screen, feature, and button have — and where do we copy it from?
> **METHOD:** Official motion specs (Material 3 tokens, IBM Carbon, Adobe Spectrum 2, MDN), motion engineering essays (Emil Kowalski, Rauno Freiberg), and library docs (Motion, react-modal-sheet, NumberFlow, canvas-confetti, Sonner) fetched 2026-11-07. Exact values below are quoted from those sources or derived from them and marked as such.
>
> **LIVE IMPLEMENTATION:** [`prototype/index.html`](../prototype/index.html) builds this choreography; recordings in [`prototype/shots/`](../prototype/shots/) (`motion-ring.gif`, `motion-pay.gif`).

**Verification legend**

| Tag | Meaning |
| :--- | :--- |
| **V-S** | Verified from an official spec or docs page (value quoted). |
| **D** | Derived from a verified rule, our own design decision. |
| **U** | Opinion or unmeasured claim. Do not present as fact. |

---

## 0. The six moments that sell the demo

Motion should be concentrated in six moments, not sprayed everywhere. These are the ones to build first and to show in the judging video.

| # | Moment | Screen | Timing | Where it comes from |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **The round ring fills as people pay** | Circle dashboard | 700ms draw on first view, then 240ms per confirmed segment | Spectrum progress semantics; Material 3 duration tokens **V-S** |
| 2 | **The sats counter rolls when the rate locks** | Payment sheet | 300ms number roll, 140ms rate chip flip | NumberFlow **V-S**; Motion |
| 3 | **NWC auto-pay, three stages** | Payment sheet | 120ms stagger, 200ms check draw per stage | Carbon productive motion **V-S** |
| 4 | **Payment lands: check draws, one confetti burst** | Success | 900ms total, one time | canvas-confetti **V-S** (has `disableForReducedMotion`); Carbon expressive **V-S** |
| 5 | **Receipt timeline fills with proof** | Receipt | 120ms per verified step | SUSU layout (static, from `DESIGN_REFERENCES.md`); Motion |
| 6 | **Reputation passport stamps and counts up** | Passport | 700ms ring, 500ms counters, 300ms stamp | Emil Kowalski: animate first view only **V-S** |

Rule: a judge should be able to describe the product from these six clips with the sound off. **D**

---

## 1. Motion tokens

Use these names everywhere; no ad-hoc durations in components.

```css
:root {
  /* durations — Material 3 short/medium/long scale + Carbon slots */
  --motion-instant: 90ms;    /* press feedback */
  --motion-fast: 140ms;      /* icon + colour state */
  --motion-base: 200ms;      /* default UI transition */
  --motion-medium: 280ms;    /* sheet, card expand */
  --motion-slow: 400ms;      /* route, ring draw */
  --motion-celebration: 800ms;

  /* easings — Material 3 tokens */
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --ease-enter: cubic-bezier(0.05, 0.7, 0.1, 1);   /* emphasized-decelerate */
  --ease-exit: cubic-bezier(0.3, 0, 1, 1);         /* standard-accelerate */
  --ease-linear: cubic-bezier(0, 0, 1, 1);
}
```

Sources for those values: Material 3 motion tokens (`duration-short2` 100ms … `duration-long1` 450ms, `easing-emphasized` and `-decelerate`/`-accelerate`), version v0.192 **V-S**. Carbon's productive slots (70 / 110 / 150 / 240 / 400 / 700ms) are a useful second opinion for dense data screens **V-S**.

Springs, when a spring is genuinely better than a curve (press release, sheet, success pop):

| Name | Config | Use | Source |
| :--- | :--- | :--- | :--- |
| `snappy` | `stiffness: 420, damping: 32, mass: 0.9` | button release, check pop | Motion spring model **V-S**; values are ours **D** |
| `sheet` | `stiffness: 280, damping: 32` | drag release | react-modal-sheet uses Motion for gestures **V-S** |
| `celebrate` | `stiffness: 520, damping: 20` | one-shot stamp/avatar pop | ours **D** |

Hard limits:

- UI feedback ≤ **200ms**; page transitions ≤ **400ms**; celebration ≤ **900ms**, once. Emil: “animations should usually be shorter than 300ms”, `ease-out` feels responsive **V-S**.
- Carbon's checklist: micro-interactions on user input use `ease-out` and land around 90–120ms **V-S**.
- Never animate a keyboard-initiated or high-frequency action (typing, repeated taps). Emil calls this out directly; Raycast ships with no entrance animation for this reason **V-S**.

---

## 2. Principles to design against

| Principle | What it means for us | Source |
| :--- | :--- | :--- |
| **Productive vs expressive** | Dense ledger work uses productive curves; success, milestone and judge moments may be expressive. Reserve expressive for occasional, important moments. | Carbon **V-S** |
| **Direction has meaning** | Linear = progress; diagonal = leaving the context (external link); clockwise = waiting/indeterminate. Do not use clockwise motion for anything that is not waiting. | Spectrum 2 **V-S** |
| **Motion must be interruptible** | If a user swipes the sheet closed mid-open, it must follow the finger, not finish the script first. | Rauno Freiberg **V-S**; Emil **V-S** |
| **Spatial consistency** | A receipt opens from the card that represents it; the sheet rises from the button that opened it. | Rauno **V-S** |
| **Purpose and frequency** | First view of the passport: animate. Tenth visit: do not. | Emil **V-S** |
| **Performance is part of the design** | Animate `transform` and `opacity` only; prefer CSS/WAAPI when the main thread is busy. | Emil **V-S** |
| **Accessibility is not optional** | `prefers-reduced-motion`, plus no large-area scaling or panning for vestibular safety. | MDN **V-S**; Spectrum **V-S** |
| **Tell the truth with progress** | No fake percentages; indeterminate states use clockwise/linear, determinate states show real counts. | Spectrum **V-S** |

---

## 3. Per-surface choreography

**Coverage check against `docs/PRD.md` §5.** Every shipped feature has a motion spec:

| PRD feature | Where |
| :--- | :--- |
| 1.1 Nostr identity, invite onboarding | §3.17 (keys, backup, join) and §3.12 |
| 1.2 Circle creation, rotation table | §3.17 (amount, reorder, start) and §3.2 |
| 1.3 P2P Lightning settlement (NWC + QR) | §3.4–§3.9 |
| 1.4 Co-signed reputation receipts | §3.9–§3.11 |
| 1.5 Judge 1-click simulation | §3.14 |
| 2.1 Trilingual UI | §3.13 |
| 2.2 Overdue escalation & reminders | §3.15, §3.17 (reminder copy) |
| 3.1 PaySats / mobile money adapter (P2) | §3.15 (external handoff toast) |

### 3.1 App shell and navigation

| Transition | Motion | Timing | Reference |
| :--- | :--- | :--- | :--- |
| Tab switch | Content crossfade; the active indicator slides with a CSS transform, not a shared-layout animation | 200ms indicator, 120ms content | Emil: Vercel replaced a shared-layout tab animation with CSS because the main thread was busy **V-S** |
| Push route (dashboard → receipt) | Shared-element transition on the receipt/pot card via View Transitions; fallback is a 120ms crossfade | 280ms | MDN View Transition API **V-S** |
| Back | Reverse the same transition; never a different direction | 200ms | Rauno spatial consistency **V-S** |
| App launch (cold) | No splash choreography; content fades in at 120ms | 120ms | Emil: fast, connected to user action **V-S** |

`view-transition-name` only on one element per route (the pot figure or receipt card). More than one shared element at 60fps on a budget phone is a gamble. **D**

### 3.2 Circle dashboard

| Element | Motion | Timing |
| :--- | :--- | :--- |
| Header chips | Static | 0ms |
| Next-action card | Fade + 8px rise | 200ms, delayed 40ms |
| Pot hero | Number roll on mount and on change | 600ms first, 300ms updates |
| Round progress segments | Fill left→right, one segment per member | 240ms + 40ms stagger |
| Rotation list rows | Fade + 6px rise, stagger cap 6 rows | 30ms stagger, ≤ 420ms total |
| Ring (tablet/desktop) | `stroke-dashoffset` draw | 700ms once |
| New payment arrives (SSE) | Pill crossfade 140ms, row tint 200ms, segment fill 240ms | 240ms |
| Round changes | Current row scale 1.02 once + border colour | 200ms, no loop |

Why cap the stagger: an unbounded list stagger on a 12-member circle means a 360ms+ cascade before the user can read the ledger, which Emil's “fast” rule argues against **V-S**. **D**

### 3.3 Rotation ring and round progress

- Draw order: track first (200ms), then confirmed segments (240ms each with 40ms stagger), then the beneficiary marker pops with `snappy` (300ms).
- The ring is never the only signal: the text `5 sur 8 confirmés` and a `role="progressbar"` carry the information. Spectrum's directional loading semantics, and GOV.UK's colour-alone rule, both point this way **V-S**.
- On completion, a single 400ms flash of the ring (`--ease-enter`), then it rests. No continuous rotation.

### 3.4 Payment sheet (NWC + QR)

| Phase | Motion | Timing |
| :--- | :--- | :--- |
| Open | Sheet rises from bottom, backdrop fades | 280ms `--ease-enter`; backdrop 200ms |
| Drag | 1:1 with finger; dismiss at 60% distance or 500px/s velocity; release uses a spring | continuous |
| Content | Header, amount, method rows appear with 20ms stagger (max 3) | ≤ 260ms |
| Close | 200ms `--ease-exit`; backdrop 140ms | 200ms |
| iOS-style depth | Optional: scale the app behind to 0.96 while the sheet is open | 280ms |

Reference: react-modal-sheet defaults — tween `{ ease: 'easeOut', duration: 0.2 }`, `dragVelocityThreshold: 500`, `dragCloseThreshold: 0.6`, and a `prefersReducedMotion` prop that snaps instantly **V-S**.

### 3.5 Amount, keypad, currency toggle

| Control | Motion | Timing | Note |
| :--- | :--- | :--- | :--- |
| Keypad digit | Press scale 0.96 | 90ms | Release springs back |
| Amount value | Digit roll (NumberFlow), not a fade | 160ms | Do not animate more than the changed digits |
| Currency toggle FCFA ⇄ Sats | Crossfade labels + roll figures; fixed width | 200ms | Layout must not shift |
| Preset chips | Selected state colour + scale 0.98 | 140ms | |
| Rate chip | Flip with a 2° rotate and fade | 200ms | One-time on rate lock; no continuous shimmer |

NumberFlow is built exactly for animated numbers and keeps the digits on one line **V-S**. Use it for the pot, the amount, and reputation counters — never for the BOLT11 string.

### 3.6 NWC auto-pay sequence

Three real stages, not a fake bar:

1. `Demande de facture` (spinner, clockwise)
2. `Signature et envoi` (spinner)
3. `Règlement` (check draw, 200ms)
4. `Reçu` (card border transitions to `success`, 200ms)

Stage rows stagger in at 120ms. The stage currently running gets a 1.4s pulsing dot (opacity only). If nothing settles after 20s, the manual QR card slides in at 200ms and the sheet does **not** close. Carbon: productive motion for task focus; expressive only for significant moments **V-S**.

### 3.7 QR fallback

- QR scales 0.96→1 with opacity, 200ms `--ease-enter`.
- BOLT11 text fades in 120ms after the QR (never at the same time).
- A single scan-sweep line may loop while the sheet is open: 2s linear, opacity-only at the ends. Stop it when the sheet closes or the tab is hidden. **D**
- Copy button: icon crossfade 140ms, check pop 180ms, Android haptic 12ms.

### 3.8 Waiting state (SSE)

- Indeterminate ring: 900ms linear rotation, clockwise, only while waiting. Spectrum: clockwise means “holding pattern” **V-S**.
- Status line updates crossfade at 100ms; keep the amount visible.
- Pause every loop when `document.hidden`; resume on visibility. **D**
- At 20s, escalate to QR fallback with a 200ms slide. Never leave a spinner forever.

### 3.9 Success and celebration

One choreographed sequence, then silence:

| Time | Event |
| :--- | :--- |
| 0ms | Sheet content fades 120ms |
| 60ms | Check circle scales 0.9→1 (`snappy`) |
| 120ms | Check stroke draws, 320ms |
| 180ms | Amount rolls, 400ms |
| 300ms | One confetti burst: 40 particles, 900ms, `useWorker: true` |
| 400ms | `Voir le reçu` CTA fades in, 200ms |

`confetti({ particleCount: 40, spread: 60, startVelocity: 28, disableForReducedMotion: true })` and lazy-import the library only on the success path **V-S** (the library documents `disableForReducedMotion` and `useWorker`). On Android, `navigator.vibrate(12)`; iOS Safari ignores it, so do not rely on haptics to carry meaning **U**.

**Do not** fire confetti on every contribution. First contribution, round completion, and circle completion only. **D**

### 3.10 Receipt / proof timeline

- Steps appear in real time as the backend confirms each one (invoice → payment → preimage → receipt). Do not pre-animate the ones that have not happened.
- Each new step: fade + 6px rise, 200ms, and the previous step's check draws 200ms.
- The `payment_hash` may scramble-decode once, 400ms, `font-mono`, `prefers-reduced-motion` → instant.
- Card border → `success` at 200ms when the timeline completes.
- Copy of the receipt link: same copy micro-interaction as §3.7.

### 3.11 Reputation passport

- First view only: ring draws 700ms, counters roll 500ms with 60ms stagger, the “verified” stamp lands with a `celebrate` spring rotation −8°→0 over 300ms.
- Return visits: static. Emil's frequency rule is explicit about this **V-S**.
- New receipt appended: one row fades in 200ms, counter rolls 300ms. Nothing else moves.

### 3.12 Join / invite

- Code characters stagger 20ms (6 chars = 120ms total).
- Copy: icon crossfade 140ms + check pop 180ms.
- After joining, the new avatar layout-animates into the member list over 240ms; one small confetti burst (20 particles) is allowed here because it is a first-time event.
- The join CTA is never delayed by the animation; it must be tappable immediately.

### 3.13 Language switch (FR / WO / EN)

- 100ms opacity dip, swap copy, restore. No layout animation, no slide.
- Preserve scroll position and focus. Switching language is a repeated action; Emil's rule says repeated actions should feel instant **V-S**.
- The pill indicator slides 140ms, nothing more.

### 3.14 Judge persona switcher

- Sheet opens like any other sheet (280ms).
- Selecting a persona: 180ms crossfade of the dashboard, avatar shared-element morph 240ms, demo bar highlight slides 200ms.
- One expressive flourish is allowed here: the three avatars deal in with a 40ms stagger, because this is the demo's showpiece. **D**

### 3.15 Toasts, errors, empty states, skeletons

| Surface | Motion | Timing |
| :--- | :--- | :--- |
| Toast in | 12px rise + opacity | 200ms `--ease-enter` |
| Toast out | 8px fall + opacity | 160ms `--ease-exit` |
| Stack reflow | Position shift only | 200ms |
| Error banner | Slide down 200ms; optional 2-cycle 4px shake (300ms) | skip shake on reduced motion |
| Skeleton | Shimmer 1.4s linear, fixed height | static under reduced motion or `saveData` |
| Empty state | Illustration fades + 8px rise once | 300ms; no looping float |

Sonner is the reference for toast feel; Emil notes it is slightly slower and uses `ease` rather than `ease-out` to feel elegant **V-S**. Do not copy its exact curve blindly; our toast is a status message, not a luxury.

### 3.16 Tab bar, FAB, pull-to-refresh

- Tab indicator: 200ms transform slide; icon scale 1→1.08→1 over 160ms.
- FAB: press 0.94 (90ms); opening the payment sheet rotates the `+` 45° over 200ms while the sheet rises.
- Pull-to-refresh: 1:1 drag to 64px threshold, spinner rotation tied to drag distance, release settles in 300ms. Rauno's “responsive gestures” rule: feel the delta immediately, then animate past the threshold **V-S**.

### 3.17 Onboarding, circle creation, reorder

| Step | Motion | Timing |
| :--- | :--- | :--- |
| Create identity | No artificial wait. The keygen screen shows a real 400ms progress arc only if generation takes longer; never a fake 2s delay | ≤ 400ms |
| Recovery words reveal | 12 word chips stagger in, 20ms each, opacity + 4px rise; the “I wrote them down” CTA enables only after the last word lands | ≤ 340ms |
| Copy `npub` / `nsec` | Same copy micro-interaction as §3.7; `nsec` copy gets a destructive-tinted toast | 140ms + 180ms |
| Contribution amount | Stepper/slider follows the finger 1:1; the FCFA ⇄ sats preview rolls with NumberFlow | 160ms per change |
| Rotation order | Drag to reorder with Motion `Reorder`: lift to scale 1.02 and a shadow at 150ms, other rows slide with a spring, drop settles in 240ms; autoscroll at the edges | 150–240ms |
| Start circle | Confirm sheet, then one “seal” moment: the ring closes from 0→360° over 400ms, the CTA becomes `Tontine active` | 400ms, once |
| Demo seed (`/api/v1/demo/seed`) | Three persona rows land with a 60ms stagger and a skeleton that resolves in place; no full-screen spinner | ≤ 400ms |
| Overdue reminder copy | Tap → toast 200ms + copy check 180ms; the WhatsApp handoff is a plain external link with the diagonal arrow motion (Spectrum) | 200ms |

Onboarding is the one place where a first-time user sees the product, so the budget is slightly more generous than the ledger. It is still capped: the whole onboarding choreography must not add more than 1 second of non-interactive time. **D**

---

## 4. Buttons and controls (the “tiny button” table)

| Control | Press | Release | Hover | Focus | Loading | Success |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary (pay) | scale 0.97, 90ms | spring `snappy`, 180ms | bg 120ms | ring appears instantly, never animated | fixed width, spinner 140ms crossfade, label at 70% opacity, `aria-busy` | morphs to check circle, 240ms |
| Secondary / outline | scale 0.98, 90ms | 160ms | border + bg 120ms | instant | same | same |
| Ghost icon (44×44) | scale 0.94, 90ms | 160ms | bg 120ms | instant | spinner replaces icon | icon crossfade 140ms |
| Copy | scale 0.96 | 160ms | bg 120ms | instant | — | icon → check, pop 180ms, revert after 2s |
| Chips / presets | scale 0.98, 140ms | 140ms | 120ms | instant | — | selected fills colour 140ms |
| Stepper − / + | scale 0.94, 90ms | 160ms | 120ms | instant | — | value rolls 160ms |
| Toggle | thumb 180ms spring | — | 120ms | instant | — | track 160ms |
| Link with arrow | arrow `translateX(2px)`, 140ms | — | 140ms | instant | — | external link: diagonal 2px (Spectrum) |
| Status pill | non-interactive by law | — | — | — | — | colour 140ms; late: 3 pulses max |
| Language pill | 90ms | — | — | instant | — | indicator 140ms |
| Destructive | opens confirm sheet; no shake on press | — | 120ms | instant | — | confirm sheet 280ms |

Reference: Spectrum 2 documents the button scaling down on the down state and arrows moving on hover, and warns to use arrow motion only on the most important action **V-S**. Carbon puts button micro-interactions at 70ms (`duration-fast-01`) **V-S**.

Never animate a focus ring; it must appear in the same frame as the focus change. **D**

---

## 5. Reduced motion matrix

`prefers-reduced-motion: reduce` must be honoured for every row. MDN: animations that scale or pan large objects can trigger vestibular discomfort **V-S**.

| Effect | Reduced-motion replacement |
| :--- | :--- |
| Sheet slide | Instant snap (react-modal-sheet `prefersReducedMotion`) |
| Check draw | Instant check |
| Ring draw | Instantly at final value |
| Number roll | Final number, 0ms |
| Confetti | Disabled (`disableForReducedMotion: true`) |
| Stagger entrances | All content at once |
| Shimmer | Static grey block |
| Scan sweep / pulses | Static |
| Haptic | Keep; it is not motion |
| Focus ring | Unchanged |

Also add an in-app **Réduire les animations** setting in the profile, stored locally, because many users on low-end phones never change the OS setting. **D**

---

## 6. Performance budget

| Budget | Limit | Why |
| :--- | :--- | :--- |
| Motion JS (gzip, initial) | ≤ 45 KB | Motion + sheet + number flow; confetti lazy |
| Long tasks during a transition | none > 50ms | 60fps target on a mid-range Android |
| Concurrent animations per screen | ≤ 3 | Jank and cognitive load |
| Celebration duration | ≤ 900ms | Beyond that it blocks the next action |
| First-paint animation payload | 0 KB | No Lottie, no Rive on first route |

Rules:

- Animate only `transform`, `opacity`, and (sparingly, mid-tier+) `filter`. Emil: those trigger composite only, while padding/margin trigger layout, paint and composite **V-S**.
- Prefer CSS transitions when the main thread may be busy; Motion runs on `requestAnimationFrame`. Emil's Vercel tab example is exactly this failure **V-S**.
- Use `LazyMotion` + `domAnimation` from Motion, and `useReducedMotion` for the hook path **V-S**.
- `will-change` only on elements that are about to animate, removed afterwards.
- Pause loops on `document.hidden`; stop them on low battery where the API allows.
- Test matrix: 360×640, 375×667, 390×844, 412×915, with 4× CPU throttle and Fast 3G in DevTools. **D**

---

## 7. What not to do

| Anti-pattern | Why |
| :--- | :--- |
| 500ms page transitions | Emil: Raycast ships no entrance animation because it is used hundreds of times a day |
| Animating every ledger row on every render | Cascade delays reading; cap the stagger |
| Elastic/bouncy motion on money amounts | Reads as unserious when the number is a debt or a late payment |
| Fake progress percentages | Spectrum: determinate progress must be real |
| Infinite decorative loops on the dashboard | Battery and data cost; low-end phones drop frames |
| Scroll-jacking or parallax in a PWA | Hostile on Android gesture navigation |
| Animating focus rings or keyboard actions | Breaks perceived speed and accessibility |
| Confetti for late payments | Celebrating a failure state |
| Lottie/Rive in the first paint | Runtime weight for a hackathon PWA |
| Scaling the whole app behind every sheet | Only for the payment sheet, and only on `md:` |

---

## 8. Where to watch motion before building

| Reference | What to watch | Link |
| :--- | :--- | :--- |
| Motion examples | enter/exit, layout, drag, spring | https://examples.motion.dev/react |
| Motion Primitives | Tailwind + Motion components, copy-paste | https://motion-primitives.com/docs |
| Magic UI | number ticker, shimmer button, confetti, animated gradients | https://magicui.design/docs/components |
| Sonner | toast stacking and exit | https://sonner.emilkowal.ski/ |
| react-modal-sheet demos | drag, snap points, iOS modal effect | https://temzasse.github.io/react-modal-sheet/ |
| canvas-confetti demo | particle tuning | https://catdad.github.io/canvas-confetti/ |
| NumberFlow | digit rolling for amounts | https://number-flow.barvian.me |
| Carbon motion | productive vs expressive | https://www.carbondesignsystem.com/building-blocks/foundations/motion/overview |
| IBM Motion Generator | duration from distance/size | https://ibm.github.io/motion/ |
| Spectrum 2 motion | directional meaning, press states | https://spectrum.adobe.com/page/motion/ |
| Material 3 motion | transitions and easing | https://m3.material.io/styles/motion/overview |
| Apple HIG motion | platform feel (rendered by JS; read in Safari) | https://developer.apple.com/design/human-interface-guidelines/motion |
| MDN View Transition API | route and shared-element transitions | https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API |
| Emil Kowalski, “Great Animations” | speed, purpose, performance, interruptibility | https://emilkowal.ski/ui/great-animations |
| Rauno Freiberg, “Invisible Details of Interaction Design” | gesture physics and spatial consistency | https://rauno.me/craft/interaction-design |

---

## 9. Sources and verification

| Claim | Source | Status |
| :--- | :--- | :--- |
| Duration tokens 50–1000ms and easing curves | Material 3 token file, v0.192 | **V-S** |
| 70/110/150/240/400/700ms slots, productive vs expressive, 90–120ms micro-interaction guidance | Carbon, Motion overview | **V-S** |
| Button down-state scaling, arrow hover motion, linear/diagonal/clockwise meaning | Adobe Spectrum 2, Motion | **V-S** |
| `prefers-reduced-motion`, vestibular risk, View Transition API | MDN | **V-S** |
| Sub-300ms, ease-out, no animation on repeated actions, transform/opacity only, interruptibility | Emil Kowalski, “Great Animations” | **V-S** |
| Gesture intent, momentum, spatial consistency, morphing | Rauno Freiberg | **V-S** |
| Sheet tween 0.2s easeOut, 500 velocity, 0.6 distance, reduced-motion prop | react-modal-sheet README | **V-S** |
| Confetti reduced-motion + worker options | canvas-confetti README | **V-S** |
| Animated numbers for amounts | NumberFlow README | **V-S** |
| Spring config values and per-screen timings | Our synthesis | **D** |
| Haptics on iOS | Not supported by Safari | **U** |
