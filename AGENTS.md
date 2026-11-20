# TontineSats — Agent Constitution & Engineering Rules

This repository follows the **Karpathy Guidelines**, **UI/UX Pro Max Visual Constitution**, and **Zero-Bloat Auditor Protocol**. Read `docs/PRD.md` and `docs/DESIGN_PRD.md` before modifying application code.

---

## 1. Core Architecture Boundaries

- **Non-Custodial Invariant:** The backend (`src/server`) must NEVER hold pooled user funds. Every contribution generates a direct BOLT11 invoice belonging to that round's beneficiary and settles peer-to-peer over Lightning (via NIP-47 NWC or QR).
- **CFA-First Display:** Every monetary amount in the UI must display West African CFA Franc (`FCFA`) as the primary figure using `tabular-nums`, with `EUR` (for diaspora) and `Sats` shown as secondary subtitles.
- **Co-Signed Reputation:** Reputation records (`kind: 30078` Nostr attestations) require payment preimage proof or beneficiary signature verification before being marked `paid`.

---

## 2. Frontend Token & Accessibility Lock (`docs/DESIGN_PRD.md`)

1. **No Hardcoded Colors:** Never use `#hex`, `rgb()`, or arbitrary Tailwind color classes (`bg-[#123456]`) in components. Use only semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-success`, `text-warning`, `text-destructive`, `border-border`).
2. **Typography Lock:**
   - Headings & Body: `Inter` (`font-sans`).
   - Currencies & Amounts: `tabular-nums` mandatory.
   - BOLT11 Invoices & `npub` strings: `JetBrains Mono` (`font-mono`).
3. **Touch & Icon Rules:**
   - Every interactive control must have a minimum hit area of `44×44px` (`min-h-[44px] min-w-[44px]`).
   - Use SVG icons (`lucide-react`) only. Text emojis in UI components are forbidden.
   - Every icon-only button requires an `aria-label`.
4. **4-State Completeness:** Every data view and action must handle `Default`, `Focus/Hover`, `Loading/Skeleton`, and `Empty/Error`.

---

## 2A. List Surface & Affordance Rules

These three rules apply to every screen and come from the project design references (`docs/LIST_SURFACE_PRINCIPLES.md`):

- **Surface, not separator:** a repeated item drawn as its own surface (card, rounded row, filled block) must **not** also carry a hairline separator between items. Hairline separators are for flat lists only (settings key/value rows). When converting a flat list to cards, remove the separators in the same change.
- **One gap token per relationship:** the vertical gap between a section label and the control or list it labels is a single value, applied everywhere that relationship appears. Do not let it drift per screen. When a spacing decision is questioned, match an existing correct instance of the same relationship rather than judging fresh.
- **Convention for the icon:** navigation and action icons use the platform's established glyph for that destination (settings = gear, notifications = bell, copy = overlapping squares, share = node graph, back = left chevron). One icon family, one stroke weight, across the whole app.

---

## 3. Karpathy Surgical Coding Principles

1. **Think Before Coding:** Verify schema contracts in `docs/PRD.md` before adding routes or database columns.
2. **Simplicity First:** Avoid speculative abstractions, unnecessary wrappers, or unrequested dependencies.
3. **Surgical Changes:** Touch only the lines required for the current task. Never reformat unrelated files.
4. **Clean Orphans:** Delete unused imports, dead helpers, and obsolete types created by your edits.

---

## 4. Crosscheck Auditor Checklist (`/prd-converge` & `/design-audit`)

Before marking any milestone complete, verify:
- [ ] **Schema & API Match:** Drizzle tables and Hono routes match Sections 3 & 4 of `docs/PRD.md`.
- [ ] **Token Purity:** `git diff` contains zero raw hex codes outside `src/index.css`.
- [ ] **Accessibility:** All icon buttons have `aria-label`; all touch targets are $\ge 44\times44\text{px}$.
- [ ] **Mobile Layout:** Zero horizontal scrolling at `375px` viewport width.
- [ ] **List Surfaces:** No card or rounded row also carries a hairline separator; every label→control gap uses one token; navigation icons use platform conventions from a single family.
- [ ] **Knowledge Graph:** Run `/understand` after codebase changes and `/understand-knowledge research` after research wiki updates.
