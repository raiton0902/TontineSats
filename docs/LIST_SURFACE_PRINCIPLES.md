# List Surface & Affordance Principles

> **STATUS:** LOCKED & APPROVED
> **SCOPE:** Every screen in TontineSats. Inherited from the design reference review (2026-11-07) and enforced by the auditor checklist in `AGENTS.md` §4.

Three rules that decide how a list, a label, and an icon look.

---

## P1 — Surface, not separator

**When a repeated item is drawn as its own surface (card, rounded row, filled block), it must not also carry a hairline separator.**

Two boundary treatments stacked on the same edge read as a rendering bug: the rule and the card border fight for the same pixels, and the double line looks heavier than the content it separates.

**Use a hairline separator only for flat lists** whose items have no surface of their own (a settings key/value table, a plain text list). A settings row is a flat list. A payment-history card is a surface.

| Item type | Boundary treatment |
|---|---|
| Flat text row, no background, no border | hairline separator is correct |
| Card with `border` + `background` + `radius` | separator is forbidden; the card edge is the boundary |
| Pill / chip / badge | no separator, no border unless it carries state |
| Full-bleed list row (edge to edge) | hairline only, never a card border |

**When converting a list from flat to card, remove the separators in the same change.** Converting one and forgetting the other is the failure this rule exists to prevent.

**In this app:** the payout-order list and the Activity history list are card lists (no separators). The Settings screen is a flat list, so its rows keep hairline separators.

---

## P2 — One gap token per relationship

**The vertical gap between a section label and the control or content it labels is a single value, applied everywhere that relationship appears.**

A label over a control is one relationship, so it gets one gap. Do not let it drift per screen: `12px` in one place and `0px` in another makes the same relationship read as two different ones, and the tight one looks like a bug even when nothing is technically wrong.

**Rule of thumb:** define the gap as a named token (`--gap-label-to-control`), use it in every instance, and change it in one place.

| Relationship | Gap | Applies to |
|---|---|---|
| Section label → its control or list | one token, uniform | segmented controls, lists, cards, tables |
| Label → its own helper text | a smaller token | form fields |
| Card → card in a group | the group gap | grids |
| Nav item → nav item | the nav gap | tab bars, sidebars |

**Verify by comparison, not by eye:** when a spacing decision is questioned, find an existing instance of the same relationship in the product that reads correctly, and match it. That reference beats a fresh judgement call.

**In this app:** `--gap-label-to-control: 12px`, applied to every section title in Dashboard, Activity, Passport, Receipt and Settings.

---

## P3 — The icon must be the destination's convention

**A navigation or action icon uses the glyph the platform already established for that meaning.** Users have muscle memory for these, and it is the fastest way to make an icon set feel native.

| Destination | Convention | Not |
|---|---|---|
| Settings / preferences | gear or cog | sliders, wrench, asterisk |
| Notifications | bell | envelope, dot, badge |
| Copy | overlapping squares | document, clipboard |
| Share | node graph or arrow out of a box | upload, paper plane |
| Back | chevron or arrow pointing left | arrow pointing right, X |
| Search | magnifier | letter, globe |
| Money / amount | currency glyph | coin stack, circle |
| Proof / verified | shield, check in a badge | star, sparkle |

**Check the whole set for one library.** Mixed icon families (a Lucide set next to a filled set) look broken even when every glyph is individually correct.

**In this app:** one SVG sprite sheet, one stroke weight (1.75), `lucide-react` geometry. Settings = gear.

---

## Checklist

- [ ] No card or rounded row also carries a hairline separator.
- [ ] Flat lists use hairline separators; surfaced lists do not.
- [ ] Every label→control gap is one token, and it is used everywhere.
- [ ] A spacing question was resolved by matching an existing instance of the same relationship.
- [ ] Every navigation icon uses the platform convention for its destination.
- [ ] The icon set comes from one family with one stroke weight.
