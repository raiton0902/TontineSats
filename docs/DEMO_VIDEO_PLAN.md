# TontineSats — Demo Video Plan

## 1. Format & Production Rules
- **Resolution & Aspect Ratio:** `1920 × 1080` (16:9 Desktop, 60 fps)
- **Target Duration:** `~2 minutes 15 seconds` (strictly under 3 minutes)
- **Style:** Real-human web recording with visible mouse arrow pointer.
- **Interaction Rhythm:** Move pointer to target → brief pause (`~0.4s`) → **zoom in** (`1.6×–2.0×`) → click or type → brief hold (`~0.5s`) → **zoom out** back to full `1.0×` view → continue narration.
- **Visual Rules:**
  - **Zero talking head**
  - **No on-screen captions**
  - **No extra UI animations or motion graphics** — just the live web app + voice-over
  - **Custom animation policy:** Only 1 optional explainer clip proposed (Scene 1 — how a tontine works), **strictly pending user approval**.

---

## 2. Scene-by-Scene Scenario & Shot List

### Scene 1 — Hook: What is a Tontine? (`0:00 – 0:20`)
- **Visual:**
  - *If animation is approved:* Clean, minimal 15-second explainer showing 8 people in a circle (Dakar + diaspora in Paris) each contributing 24,000 FCFA into a monthly pot, with one member receiving the full 192,000 FCFA each round—and showing how Bitcoin Lightning removes the need for a middleman holding the cash.
  - *If no animation:* Start directly on the **TontineSats Landing Page (`/`)** with a slow overview of the hero and live pot preview card.
- **Narration Focus:** Introduce traditional West African tontines, the trust/diaspora friction, and how TontineSats solves it non-custodially over Bitcoin Lightning.

---

### Scene 2 — Landing Page & Entering Demo Mode (`0:20 – 0:38`)
- **Route:** `/`
- **Actions:**
  1. Start on the full landing page (`1.0×`).
  2. Move pointer to the language switch (`FR / EN / WO`) → pause → **zoom in** → click `EN` → **zoom out**.
  3. Move pointer slowly over the **Preview Pot Card** (`192,000 FCFA`, 8 members) to highlight the CFA-first display.
  4. Move pointer to **Try demo** button → pause → **zoom in** → click → **zoom out** into `/app`.
- **Narration Focus:** Explain CFA-first pricing (FCFA primary, EUR & Sats secondary) and jump straight into a live circle.

---

### Scene 3 — Circle Dashboard & Diaspora Switch (`0:38 – 1:02`)
- **Route:** `/app` (Demo Mode — *Tontine Sandaga*)
- **Actions:**
  1. Show the full dashboard (`1.0×`): Pot progress ring, 8-member rotation list, and Round 3 beneficiary (**Mariama Sow**).
  2. Move pointer to the **Persona Switcher** → pause → **zoom in** → click **Moussa Diallo (Paris · Diaspora)** → **zoom out**.
  3. Pause briefly so viewers see the UI adapt for a diaspora member in Paris (EUR + FCFA + Sats).
- **Narration Focus:** Show how local members in Dakar and diaspora members in Paris participate in the same circle with transparent, real-time FX conversion.

---

### Scene 4 — Non-Custodial Lightning Payment (`1:02 – 1:32`)
- **Route:** `/app` → `PaymentSheet`
- **Actions:**
  1. Move pointer to the **Contribute / Pay Round 3** button → pause → **zoom in** → click → **zoom out** as the payment sheet opens.
  2. Highlight the beneficiary line (**direct to Mariama Sow**) and the amount (`24,000 FCFA` + EUR/Sats subtitle).
  3. Move pointer to the **Pay with Lightning** button (or toggle to QR BOLT11 invoice briefly, then confirm) → pause → **zoom in** → click → **zoom out**.
  4. Watch the payment settle directly peer-to-peer and update the pot ring.
  5. Move pointer to **View Receipt** → pause → **zoom in** → click → **zoom out**.
- **Narration Focus:** Emphasize the core non-custodial invariant—TontineSats never holds pooled funds; every contribution generates a direct BOLT11 invoice for that round's beneficiary.

---

### Scene 5 — Cryptographic Proof & Trust Passport (`1:32 – 1:52`)
- **Route:** `/app/receipt/3` → `/app/passport`
- **Actions:**
  1. On the Receipt page, move pointer to the **payment preimage & Nostr `kind: 30078` verification badge** → pause → **zoom in** → hold `1.5s` → **zoom out**.
  2. Move pointer to the **Passport** navigation tab → pause → **zoom in** → click → **zoom out**.
  3. Show the **100% On-Time Score Ring**, portable Nostr `npub`, and verified receipt history.
- **Narration Focus:** Explain co-signed Nostr reputation—every on-time payment builds a portable, cryptographic Trust Passport that members own and can take to any future circle.

---

### Scene 6 — Real Working Flow: Creating a Live Circle (`1:52 – 2:15`)
- **Route:** `/app` (Live Backend) → `CreateCircleSheet`
- **Actions:**
  1. Move pointer to **New Circle** → pause → **zoom in** → click → **zoom out** as the creation sheet opens.
  2. Move pointer to the **Circle Name** input → pause → **zoom in** → type `Dakar Builders` → **zoom out**.
  3. Move pointer to the **Contribution (FCFA)** input → pause → **zoom in** → type `10000` (showing live EUR and Sats calculation underneath) → **zoom out**.
  4. Move pointer to **Create Circle** button → pause → **zoom in** → click → **zoom out**.
  5. Show the real invite code and shareable join link generated by the backend.
- **Narration Focus:** Show that anyone can spin up a real circle in seconds, invite members with a link, and start saving together immediately.

---

### Scene 7 — Outro (`2:15 – 2:22`)
- **Visual:** Clean full-screen view of the active circle dashboard (`1.0×`), gentle fade out.
- **Narration Focus:** Closing tagline — *TontineSats: Traditional community savings, powered by Bitcoin Lightning and Nostr.*

---

## 3. Technical Recording Plan (After Voice-Over is Ready)
1. **Generate voice-over** in Google AI Studio and export `.wav` or `.mp3`.
2. **Measure exact timestamps** of each sentence/beat in the audio.
3. **Run TontineSats locally** (`npm run dev` with live SQLite/LibSQL backend + seeded demo).
4. **Record / render** using Playwright (real headless Chromium driving the live app with an injected custom mouse cursor) + Remotion/FFmpeg for smooth `zoom-in → interact → zoom-out` camera keyframes synced to the exact voice-over timestamps.
5. **Mux final MP4** (`1920×1080`, 60 fps, H.264 + AAC).
