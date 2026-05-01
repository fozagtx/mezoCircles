# mezoCircles — Contract Audit

**Scope:** `SavingsCircle.sol`, `SavingsCircleFactory.sol`, `ReputationSystem.sol`, `AchievementBadge.sol`, `script/Deploy.s.sol`
**Compiler:** 0.8.24, optimizer 200 runs
**Test status:** 11/11 passing
**Audit type:** Self-audit, hackathon-grade. NOT a substitute for a third-party formal audit before mainnet.

## Summary

| Severity | Count | Fixed | Open | Accepted |
|----------|-------|-------|------|----------|
| 🔴 HIGH    | 3     | 3     | 0    | 0        |
| 🟡 MEDIUM  | 6     | 3     | 0    | 3        |
| 🟢 LOW     | 10    | 2     | 0    | 8        |

- **Fixed (8):** H-1, H-2, H-3, M-1, M-3, M-6, L-1, L-4
- **Accepted (11):** M-2, M-4, M-5, L-2, L-3, L-5, L-6, L-7, L-8, L-9, L-10 — known limitations, documented below

---

## Severity Legend

- 🔴 **HIGH** — funds at risk or full DoS
- 🟡 **MEDIUM** — partial DoS, unexpected behavior, or production-blocker
- 🟢 **LOW** — code-smell, gas, dead code, or informational

---

## 🔴 HIGH

### H-1. Payout DoS via non-receivable recipient (native BTC mode) — ✅ FIXED
**Original:** `settleCycle()` pushed via `recipient.call{value: pot}("")`. A contract member with no `receive()` / `fallback()` would revert the call forever, locking the pot and bricking the circle.

**Fix:** switched to a pull-pattern. `settleCycle()` now accrues to `pendingPayout[recipient]` and emits `PayoutAccrued`. The recipient calls `claimPayout()` separately. One member's failed claim cannot block other cycles.

**Test:** `test_nonReceivableRecipient_doesNotBrickCircle` — joins a member contract that rejects native BTC; the circle still progresses through all cycles, only that member's `claimPayout` reverts.

### H-2. No emergency exit / pause — ✅ FIXED
**Original:** no per-circle abort, no refund path. A stalled circle (e.g. via H-1, broken vault, or external token bug) locked funds permanently.

**Fix:** added `abort()` callable by anyone after `cycleDeadline + ABORT_GRACE` (7 days). Marks the circle `Aborted`, redeems any vault shares, and credits each depositor's principal for unsettled cycles to `refundOwed[member]`. Members reclaim via `claimRefund()`.

**Test:** `test_abort_refundsUnclaimedPrincipal` — depositors recover their principal after grace period; double-claim reverts with `NothingToClaim`.

### H-3. ERC-20 return-value assumption — ✅ FIXED
**Original:** raw `IERC20.transfer/transferFrom/approve` calls assume a `bool` return. Non-conformant tokens (USDT-style) revert before our check.

**Fix:** adopted OpenZeppelin `SafeERC20` throughout (`safeTransfer`, `safeTransferFrom`, `forceApprove`). Handles both bool-returning and void-returning ERC-20 implementations.

---

## 🟡 MEDIUM

### M-1. Fee-on-transfer / rebasing tokens silently break pot accounting — ✅ FIXED
**Fix:** balance-diff guard in `deposit()` — measures actual credited amount and reverts with `WrongDepositAmount` if it differs from `contributionAmount`. Standard ERC-20 behavior is unchanged; non-standard tokens fail loudly instead of silently breaking accounting.

```solidity
uint256 before = IERC20(token).balanceOf(address(this));
IERC20(token).safeTransferFrom(msg.sender, address(this), contributionAmount);
uint256 received = IERC20(token).balanceOf(address(this)) - before;
if (received != contributionAmount) revert WrongDepositAmount();
```

### M-2. Validator-manipulable randomness for payout order — ⚠️ ACCEPTED (hackathon)
Seed = `keccak256(prevrandao, timestamp, circleId, address(this))`. Validators can influence `prevrandao` within a window. The last member to join can simulate the shuffle and decline / retry.

**Accepted because:** mitigations (commit-reveal or VRF) are out of scope for the hackathon. Comment in `_shuffleMembers` flags this. For production: commit-reveal where each member commits a hash and reveals secret on join, seed = XOR of reveals. Or Chainlink VRF / drand.

### M-3. Factory `indexMembership` failure silently swallowed — ✅ FIXED
**Fix:** removed the `try/catch`. Factory is a known, trusted contract — failure means a real bug and should propagate, not silently desync the discovery feed.

### M-4. Factory storage growth via spam — ⚠️ ACCEPTED (hackathon)
`createCircle` has no fee, rate-limit, or stake. Spam-creation bloats `allCircles`/`circlesByCreator`/`circlesByMember`.

**Accepted because:** for testnet hackathon scope, spam griefing isn't a real threat; gas alone disincentivizes it. For mainnet: add a refundable bond on createCircle, or cap pending circles per creator.

### M-5. Trust assumption on `yieldVault` — ⚠️ ACCEPTED (documented)
The vault is external and chosen at create time; the asset-match check at init doesn't make it safe.

**Accepted because:** users explicitly opt into yield by selecting a vault. Asset-match validation prevents the most obvious misconfig. The frontend flag `YIELD_VAULT_AVAILABLE` only enables the toggle when a single trusted testnet address is configured via env. For mainnet: maintain a factory-level allowlist of vetted vaults.

### M-6. Approve-race on auto-stake — ✅ FIXED
**Fix:** replaced `IERC20.approve` with `SafeERC20.forceApprove`, which sets allowance to 0 first when needed (USDT-style tokens). Reentrancy on the deposit path is independently blocked by `nonReentrant`.

---

## 🟢 LOW / Informational

### L-1. Unused error `NotYourTurn` — ✅ FIXED (removed)

### L-2. Unused storage — ⚠️ ACCEPTED
`ReputationSystem.Profile.referrer` and `SavingsCircle.memberIndex` are written but not read internally. `memberIndex` is publicly readable via the auto-generated getter and is useful externally. `referrer` is a known dead-write — kept for future referral analytics.

### L-3. `circleId` parameter ignored in reputation calls — ⚠️ ACCEPTED
`recordDeposit`/`recordMissedPayment`/`recordCircleCompleted` accept `circleId` but don't use it. Reserved for future per-circle analytics (XP attribution by circle). Removing from the interface now would force a contract redeploy when we add it back.

### L-4. `string memory` → `string calldata` on `initialize` — ✅ FIXED

### L-5. No `RankChanged` emitted on first XP gain — ⚠️ ACCEPTED
First XP from 0 stays at Bronze, so no rank-change event. UX/analytics smell only — cohort tracking can use `XPGained` instead.

### L-6. `_safeMint` revert path swallowed by SavingsCircle's try/catch — ⚠️ ACCEPTED
Acceptable: badges are best-effort and shouldn't block deposits/settlement. Members who want their badge can use an EOA. Switching to `_mint` is a future polish (soulbound tokens don't need receive-callback semantics anyway).

### L-7. `Deploy.s.sol` skips ownership transfer — ⚠️ ACCEPTED (testnet)
Deploy script leaves ownership with the deployer EOA. For testnet/hackathon, this is fine. **For mainnet: transfer to a multisig before announcing.**

### L-8. No events for `setSystems`/`setFactory`/`setBaseURI`/`transferOwnership` — ⚠️ ACCEPTED
Privileged config changes are infrequent (one-shot at deploy). Not adding events to keep the contract surface minimal; for production monitoring, watch the contract owners' transactions instead.

### L-9. Magic numbers — ⚠️ ACCEPTED
`maxMembers ∈ [3,10]`, `cycleDuration ≥ 1h`, XP constants. Hardcoded for simplicity. A config struct would be cleaner but isn't a correctness issue.

### L-10. Pragma exact-pinned (`0.8.24`) — ⚠️ ACCEPTED
Reproducibility over patch upgrades. We'll re-pin on a deliberate compiler bump.

---

## Out of Scope / Not Found

These common issues were checked and are **not present**:

- **Reentrancy on deposit/settleCycle/claimPayout/claimRefund/abort** — all state mutations gated by inline `nonReentrant`; pull-pattern means external calls happen after state writes.
- **Initialization front-run** — clones are deployed and initialized in the same factory tx; no window.
- **Integer over/underflow** — Solidity 0.8.x default checked arithmetic; explicit `uint64(uint256(-delta))` cast is bounded by small constants.
- **Soulbound bypass** — `AchievementBadge._update` reverts when both `from` and `to` are non-zero. Tested.
- **Authorization bypass on rep/badge** — `onlyAuthorized` modifier; only factory-tracked circles can write.
- **Vault asset confusion** — `initialize` reverts with `VaultAssetMismatch` if `vault.asset() != token`.
- **Pull-claim accounting drift** — `totalPending` tracks accrued-but-unclaimed pots, subtracted from loose balance when computing each new cycle's pot, so subsequent cycles can't double-spend earlier cycles' funds.

---

## What Changed in This Audit Round

**Contract changes** (`SavingsCircle.sol`):
- Added `Status.Aborted` and `ABORT_GRACE = 7 days` constant.
- Added `pendingPayout`, `totalPending`, `refundOwed` mappings.
- New functions: `claimPayout()`, `claimRefund()`, `abort()`.
- New events: `PayoutAccrued`, `CircleAborted`, `RefundClaimed`. `PayoutClaimed` repurposed for the claim event.
- Adopted `SafeERC20` (uses `safeTransferFrom`, `safeTransfer`, `forceApprove`).
- Balance-diff guard in `deposit()` against fee-on-transfer/rebasing tokens.
- Removed try/catch around `factory.indexMembership`.
- `settleCycle()` no longer pushes payout — accrues to `pendingPayout` and advances state.
- Helpers `_redeemAllVault()` and `_payOut()` extracted.
- Removed unused `NotYourTurn` error.
- `string memory _name` → `string calldata _name` in `initialize`.

**Test changes** (`test/SavingsCircle.t.sol`):
- Existing tests updated to call `claimPayout()` after `settleCycle()`.
- Added `test_nonReceivableRecipient_doesNotBrickCircle` (proves H-1 fixed).
- Added `test_abort_refundsUnclaimedPrincipal` (proves H-2 fixed).
- Added `RejectingRecipient` mock (no receive/fallback).

**Frontend changes** (`web/src/`):
- `lib/abis.ts`: extended `circleAbi` with `claimPayout`, `claimRefund`, `abort`, `pendingPayout`, `refundOwed`, `ABORT_GRACE`.
- `app/circles/[address]/page.tsx`: claim/refund buttons appear when amounts are owed; abort button visible to creator after grace period; `STATUS` array includes `aborted`.

---

## Pre-Deploy Checklist (Mainnet)

If this contract is ever pushed beyond testnet:

- [ ] Replace `prevrandao` shuffle with commit-reveal or VRF (M-2)
- [ ] Add yield-vault allowlist at the factory level (M-5)
- [ ] Add per-creator pending-circle cap or refundable bond (M-4)
- [ ] Transfer ownership of `rep`, `badge`, `factory` to a multisig (L-7)
- [ ] Third-party formal audit
- [ ] Document trust assumptions in user-facing UI (yield vault, randomness)
- [ ] Decide on referrer/circleId fields (L-2, L-3) — wire in or remove from interface

For the **hackathon / testnet**, current state is acceptable: HIGH issues are fixed, MEDIUM/LOW residuals are documented, and the integration tests cover the happy path plus the two formerly-bricking edge cases.
