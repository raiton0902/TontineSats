# Design Sources

Raw notes for the design reference search. Created 2026-11-07. Do not edit after creation.

## Method
- App Store listings queried via the iTunes Search API, iPhone (`screenshotUrls`) only.
- 1–5 screenshots per app downloaded and inspected visually. Fourteen curated copies are stored in `docs/assets/design-refs/` for study; the rest resolve again from the App Store ID.
- Product pages fetched as text for model and wording claims.
- Anything not opened is marked unverified.

## Apps inspected (screenshot evidence)

| App | Store ID | Market | Notes extracted |
|---|---|---|---|
| SÒL | 6792436901 | US / Caribbean | Non-custodial circles; `Your next moves`; member due card; `Round 3 of 8`, `5/8 records confirmed`; Trust Passport `92/100`; activity day strip; notification filters |
| The SUSU App | 6748971171 | US / Caribbean | `UP NEXT` pay card; segmented round bar; payout order `R1…R4`; payout receipt timeline + breakdown; contribute sheet with `Rounds to cover` stepper |
| Daret | 6751736492 | Morocco (MAD) | Dark green / cream; profile header; circle rows with `500 MAD` / `2400 MAD` right-aligned |
| Money Fellows | 1113492041 | Egypt (EGP) | `PAYOUT AMOUNT` + ruler slider with min/max; 3-step progress bar; tiered circle cards (`LITE SAVER`, `3,000 EGP`) |
| Zepargn | 6474701827 | Benin (FCFA) | Orange balance header `250.000 FCFA`; `J'épargne` / `Je retire` pills; goal progress `100 000 / 250 000`; signed history rows; `Bravo !` success modal |
| MaTontine | 1636616436 | Senegal (FCFA) | Flag-circle language picker; giant logo wallpaper; 7-row text menu; duplicated bottom tabs. Anti-reference |
| Wave | 1523884528 | Senegal | `50.500F` centred with eye toggle; floating QR card; 4 circular actions; ledger rows `-2.000F`; keypad with letters; fee line `Wave's fee = 1%` |
| Djamo | 1504072402 | Côte d'Ivoire | `Mon solde / 250.600 FCFA`; `Transférer` / `Payer` pills; VISA card; signed history |
| Lydia | 6475691727 | France | `Send money` / `Collect money` split with centre button; payment link rendered inside a chat thread |
| LemFi | 1533066809 | UK → Africa | Stacked account rows; `You send £1,000.00`; rate chip `1 £ = ₦3645` |
| NALA | 1549983218 | EU/UK/US → Africa | `Rates $1 = 88 INR` + `Compare rates →`; `Send` + `Add recipient` pills; avatar rail; `✓ Completed` transaction pill |
| Wise | 612261027 | Cross-border | Locked rate `🔒 1 EUR = 0.83336 GBP`; `You send` / `gets`; breakdown rows with `Change` pill |
| Tricount | 349866256 | France | White pill ledger rows `Paid by Julia`, `Split 3 ways` |
| Splitwise | 458023433 | US | `Overall, you owe $287.49`; per-group `YOU OWE` orange / `you are owed` green / `settled up` grey; `Settle up` + `Balances` + `Totals` |
| Blink | 1531383905 | Lightning | `$4.20` over `~ 10,162 sats`; dual account balances; POS keypad; `Add note ✎` |
| Phoenix | 1544097028 | Lightning | `28,000 sat ⇅`; `≈ 9.72 USD`; green `⚡ Pay`; fee breakdown `0.41%` |
| Alby Go | 6471335774 | Lightning | `₿ 256 032` / `$299.96`; two large `Receive` / `Send` square buttons |
| Cowrywise | 1436590033 | Nigeria | Preset amount chips `₦50K ₦100K ₦300K` / `$100 $1,000`; balance card with sparkline |
| PiggyVest | 1263117994 | Nigeria | Savings framing; no group-rotation screens found |
| Damus | 1628663131 | Nostr | Purple brand; no specific `npub` control worth citing |
| Primal | 1673134518 | Nostr | Dark feed; zap counts; no specific `npub` control worth citing |

## Pages fetched (text evidence)

| Page | What was extracted |
|---|---|
| https://design-system.service.gov.uk/components/button/ | Avoid disabled buttons; prevent double click; show a spinner on slow connections; 4.5:1 contrast for buttons on dark; sentence-case action labels |
| https://design-system.service.gov.uk/components/tag/ | Tags are status only, never interactive; use adjectives not verbs; never colour alone (WCAG 2.2 1.4.1) |
| https://www.blink.sv/en/circles | Blink Circles is a referral/adoption tracker (`Inner Circle`, `Outer Circle`), not a savings circle. Rejected |
| https://www.cowrywise.com/circles/ | Circles is a savings competition leaderboard. Only preset amount chips are relevant |
| https://www.djamo.com/ | French fintech vocabulary and tone for the CI market |
| https://wise.design/ | Direction and principles only; no published tokens |
| https://www.moneyfellows.com/ | Custodial, bank-regulated positioning; 8M users |

## App Store descriptions read
SÒL, SUSU, Daret, Money Fellows, Zepargn, MaTontine, Wave, Djamo, Lydia, LemFi, NALA. Used for model claims only, not for visual claims.

## Not verified
- Runtime performance on low-end Android or 2G/3G.
- Stripe dashboard pill tokens and Monzo pot rings (cited in `REFERENCES.md`, not re-checked here).
- Whether SÒL accepts anything beyond photo proof.
