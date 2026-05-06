# mezoCircles — Next

Prioritised work list. Top of the list = do next. Nothing here is mid-flight; mid-flight goes in `SCRATCHPAD.md`.

---

## 🔥 Now (testnet ship)

### 1. Deploy contracts to Mezo testnet
- [ ] Run `forge script script/Deploy.s.sol --rpc-url https://rpc.test.mezo.org --broadcast --private-key <KEY>` from `contracts/`
- [ ] Copy the three printed addresses into `web/.env.local`:
  - `NEXT_PUBLIC_FACTORY_ADDRESS`
  - `NEXT_PUBLIC_REPUTATION_ADDRESS`
  - `NEXT_PUBLIC_BADGE_ADDRESS`
- [ ] Smoke-test from `web/`: connect wallet, create a native-BTC circle, have a second wallet join, deposit, settle, claim

### 2. Fill in mUSD + yield vault addresses
- [ ] Find the canonical Mezo testnet mUSD ERC-20 address (Mezo docs / Discord)
- [ ] Find a vetted ERC-4626 vault on testnet whose `asset()` matches mUSD, OR ship without yield for now and leave vault zero
- [ ] Set `NEXT_PUBLIC_MUSD_ADDRESS` and (optionally) `NEXT_PUBLIC_YIELD_VAULT_ADDRESS` in `web/.env.local`
- [ ] Verify the `MUSD_AVAILABLE` / `YIELD_VAULT_AVAILABLE` UI gates flip on

### 3. Brand pass on remaining pages
The home and Shell ship the redesign; everything else inherits tokens but hasn't been redesigned. Go page-by-page:
- [ ] `circles/` listing — pill-tag header, editorial typographic treatment
- [ ] `circles/[address]` — apply display serif on circle name, lime claim CTA, brown stat tiles
- [ ] `circles/new` — form refresh: rounded-2xl inputs, asset picker styled with pills, lime submit
- [ ] `quests` — daily quest card uses lime accent on hover (already partially)
- [ ] `profile` — RankBadge component visual upgrade

### 4. Fix pre-existing TS errors
Two files have `Object is possibly 'undefined'` from `useReadContracts` slot narrowing:
- [ ] `web/src/app/circles/[address]/page.tsx` lines 40–47
- [ ] `web/src/components/CircleCard.tsx` lines 17–21

Fix with non-null assertion or proper narrowing (`if (!data?.[0]?.result) return …`). Do this before next push so type-check is clean.

---

## ⏸ Soon (post-testnet, before any mainnet talk)

### Audit MEDIUM follow-ups (deferred but documented in `contracts/AUDIT.md`)
- [ ] **M-2**: replace `prevrandao` shuffle with commit-reveal (each member commits secret hash, reveals on full circle, seed = XOR of reveals)
- [ ] **M-4**: per-creator pending-circle cap or refundable bond on `createCircle`
- [ ] **M-5**: factory-level allowlist of vetted yield vaults

### Bot
- [ ] Update `bot/.env` with the three deployed contract addresses
- [ ] Confirm event handlers cover the new events: `PayoutAccrued`, `PayoutClaimed` (now claim-event, not settle-event), `CircleAborted`, `RefundClaimed`

### LOW polish
- [ ] L-7: Transfer ownership of `rep`, `badge`, `factory` to a multisig (mainnet only)
- [ ] L-8: Add events to `setSystems` / `setFactory` / `setBaseURI` / `transferOwnership`
- [ ] L-2: Decide on `referrer` field — wire it into a referral discovery view, or remove

---

## 🧊 Maybe / ideas

- Lifestyle photography in the hero section (Onboard-style editorial: rooftop, desert, candid). Need licensed assets.
- Animated floating notification toasts on the hero ("Circle settled · 0.03 BTC paid out").
- Per-circle analytics view (uses `circleId` we're already tracking but not surfacing — see L-3).
- Telegram bot Web App link from inside the bot (still not a Mini App, just a deep link).

---

## ❌ Won't do

- Mainnet deploy on this branch — see `MEMORY.md`. Not until M-2/M-4/M-5 + third-party audit + multisig handoff.
- Refactor to monorepo. The three-folder layout is intentional.
- Mocked/seeded data anywhere in the UI.
