# mezoCircles — Scratchpad

Mid-flight thoughts, half-decisions, things to try, things to investigate. Anything in here is *unconfirmed*. Promote to `MEMORY.md` once decided; promote to `NEXT.md` once it's an actual to-do.

---

## Open questions

- **Mezo mUSD address on testnet?** Not posted in this repo. Need to grab from Mezo docs / `forum.mezo.org` / their Discord before testnet demo.
- **ERC-4626 vault on Mezo testnet?** Unknown if any exist yet. If none, ship native-BTC circles only and set `YIELD_VAULT_AVAILABLE = false`.
- **Mezo gas oddity?** BTC is the gas token. Need to verify `parseEther` vs decimal handling in our deposit flow doesn't surprise users used to ETH.
- **Should `claimPayout` allow specifying a different receiver?** Right now it always pays out to `msg.sender`. Could be useful if recipient address rotates wallets, but adds a phishing surface. Probably no.

## Ideas to consider

### Hero photography
Onboard's hero is candid editorial lifestyle (rooftop, desert, party). We don't have licensed photography. Options:
- (a) Use an abstract animated illustration of money rotating between people (cheap, fits crypto)
- (b) Generated AI imagery (cheap, risks looking cheap)
- (c) Buy Unsplash+ subscription and use real photos (~$15/mo, fastest)
- (d) Skip it — keep the typographic hero with no image, lean fully into the editorial-typeface look

Default: (d) for hackathon. Revisit later.

### Notification toasts on hero
Onboard floats fake notification cards on the hero ("Payment Successful -4.20 USD"). For us:
- "Circle settled · received 0.03 BTC"
- "Yield accrued · +0.0004 BTC this cycle"
- "New badge: 7-day streak"

These would have to be **real recent events from the chain** (per the no-mocks rule), not faked. So: pull recent events via wagmi log subscription, render as toasts. Real, but maybe noisy. Try after testnet deploy when there are real events to subscribe to.

### Commit-reveal randomness (M-2)
Sketched flow:
1. On `join`, member submits `keccak256(secret, salt)`.
2. Once circle is full, each member calls `reveal(secret, salt)` within a window.
3. Once all revealed (or window expires), seed = XOR of all revealed secrets.
4. Anyone calls `finalize()` which uses the seed to shuffle.

Edge cases:
- Non-revealing member → punish (slash a small bond, or just exclude from shuffle). Needs a bond.
- Adds two more user actions before circle starts. Bad UX for casual users. Maybe only enable for circles above a value threshold.

Probably overkill for hackathon. Park it.

### Yield vault allowlist (M-5)
Add to factory:
```solidity
mapping(address => bool) public allowedVaults;
function setVaultAllowed(address vault, bool ok) external onlyOwner;
```
And `createCircle` checks `allowedVaults[yieldVault]` (skipping if zero). Simple. Needs a config script post-deploy. Save for production.

### Better discovery feed
Right now `useDiscoveryFeed` just calls `factory.page(0, N)`. Issues:
- No filtering by status (Pending / Active / Completed / Aborted)
- No sorting (newest first vs nearest-to-full)
- No pagination

UX wishlist: tabs at top of `/circles` → "joinable" (Pending, room left), "active" (you're a member), "completed" (history). Each tab a separate query.

Implementation: add `getJoinableCircles()` view to factory? Or filter client-side from `page()` results. Client-side is fine for first 100; needs server-side as it grows.

### Bot refresh
- Current bot polls blocks. With pull-pattern, the meaningful event for users is now `PayoutClaimed`, not the auto-paid `PayoutAccrued`. Bot should ping recipients on `PayoutAccrued` ("hey, your pot is ready, claim here") and on `PayoutClaimed` (confirmation).
- Add abort + refund handlers.

---

## Investigations to run

- [ ] Check actual gas cost of `claimPayout` on Mezo — is it expensive enough that a user might not bother claiming small amounts? If yes, batch-claim across multiple cycles.
- [ ] Check if Mezo testnet faucet works for the demo wallets.
- [ ] Verify `forge install` dependencies are committed under `contracts/lib/` in the pushed repo, or if `.gitignore` excluded them. If excluded, add a setup step to `AGENTS.md`.

## Scratch design notes

- Section dividers: tried full-width brown `--mx-6` block on home. Looks dramatic but eats vertical space. May be too much for a content-light page; reconsider.
- The marquee in Shell.tsx renders 4× to ensure overflow. CSS `animation: ticker-left` runs 28s, may feel slow on mobile. Test on phone.
- Ghost-text trick on hero ("**minus** the banks" pulses opacity 0.18 → 0.45). Reads as broken on slow displays. Maybe replace with a static reduced-opacity span.

---

## Promotion log

When something here gets confirmed, mark it and move it.

- ~~Pull-pattern payouts~~ → confirmed → moved to `MEMORY.md`
- ~~7-day abort grace period~~ → confirmed → moved to `MEMORY.md`
- ~~Drop Telegram WebApp script~~ → confirmed → moved to `MEMORY.md`
