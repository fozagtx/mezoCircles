# Mezo Capabilities Validation — 2026-05-20

Pre-build audit before scoping mezoCircles. Source documents listed at bottom.

## Summary

| Assumption from original pitch | Verdict | Build impact |
|---|---|---|
| MUSD CDP live on Mezo testnet | ✅ Confirmed | Build against it now. |
| "Locked, fixed 1% MUSD rate" | ⚠️ Partial — actually 1–5% APR fixed for life | Rewrite all "1%" copy. |
| ERC-4337 AA + passkey UX | ❌ Not available | Cut from v1. Use EOA wallets. |
| tBTC bridge on testnet | ⚠️ Mainnet only; testnet uses faucet BTC | Demo on testnet w/ faucet; mainnet flow shows real bridge. |
| veMEZO / gauge voting | ✅ Live (ve(3,3)) | Integratable, but get fresh addresses from explorer. |

## 1. MUSD CDP — Liquity v2 fork

Mezo's MUSD is a Liquity-v2/Threshold-USD fork. Source: `github.com/mezo-org/musd`.

**Architecture** (mirrors Liquity):

- `BorrowerOperations` — user entry point. `openTrove`, `addColl`, `withdrawColl`, `withdrawMUSD`, `repayMUSD`, `adjustTrove`, `closeTrove`.
- `TroveManager` — per-borrower state. Status, debt, coll, ICR getters.
- `StabilityPool` — MUSD deposits that absorb liquidations.
- `PCV` — Protocol-controlled value; fee sink.
- `SortedTroves`, `HintHelpers`, `InterestRateManager`, `PriceFeed`, `ActivePool`, `DefaultPool`, `CollSurplusPool`, `GasPool`.

**Fees (corrected):**

- Interest rate: **1%–5% APR** range, governed protocol-wide by `InterestRateManager`. Earlier interpretation that rate is "chosen at open" per-trove was WRONG — Mezo's fork is a simplified Liquity v1, not v2 with per-trove rates. There is no `_interestRate` parameter on `openTrove`. Verified by `cast call` against deployed `BorrowerOperations` on 2026-05-20: only 3-arg `openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint)` is recognized.
- Refinancing fee: configurable issuance %.
- Redemption fee: **0.75% on BTC received** (waived if redeemer also has an open trove).

**BorrowerOperations actual signatures (verified live):**

```solidity
function openTrove(uint256 _debtAmount, address _upperHint, address _lowerHint) external payable;
function addColl(address _upperHint, address _lowerHint) external payable;
function withdrawColl(uint256 _amount, address _upperHint, address _lowerHint) external;
function withdrawMUSD(uint256 _amount, address _upperHint, address _lowerHint) external;
function repayMUSD(uint256 _amount, address _upperHint, address _lowerHint) external;
function closeTrove() external;
function adjustTrove(uint256 _collWithdrawal, uint256 _debtChange, bool _isDebtIncrease, address _upperHint, address _lowerHint) external payable;
```

Note the simplified shape: no `_maxFeePercentage`, no `_interestRate`. Any third-party integration that ports a Liquity-v2 wrapper directly to Mezo will compile but revert at runtime with `"0x"` no-data (selector not found).

**Risk parameters:**

- MCR (per-trove min) = **110%**.
- CCR (system-wide Recovery Mode trigger) = **150%**.
- Min debt per trove = **1,800 MUSD**.

**Testnet addresses** (`solidity/SCALE_TEST_ADDRESSES.md` — verify on `explorer.test.mezo.org` before mainnet):

```
MUSD                  0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
BorrowerOperations    0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba
TroveManager          0x7FE0A5a7EeBD88530c58824475edEae33424671F
StabilityPool         0xCfdb903cD2Dc14E24e78130A63b20Ba65107262A
PCV                   0xd14957C26928e5fDA27e2097dA0B95d68D3565D6
```

**Mainnet MUSD token:** `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186`.

## 2. ERC-4337 / Account Abstraction — NOT AVAILABLE

- No EntryPoint deployed on Mezo (testnet or mainnet) per public docs.
- No bundler vendor supports Mezo: checked Pimlico (80+ chains list), Stackup, Biconomy, Alchemy, ZeroDev — none.
- Mezo's L1 is Cosmos-SDK based (`mezod`), no native AA like ZKsync.
- Sanctioned wallet path is **Mezo Passport**, a connector library, not AA.

Implication: any "gasless / passkey / biometric" UX requires self-deploying:
1. Canonical EntryPoint 0.6 or 0.7
2. A bundler (fork of Alto)
3. A custom paymaster

= 4–8 weeks of infrastructure work. Deferred past v1. mezoCircles v1 uses standard EOA + MetaMask/UniSat/Xverse with BTC paying gas.

## 3. tBTC bridge

- **Mainnet:** Real tBTC bridge live. Bridged tBTC at `0x7b7C000000000000000000000000000000000000`. ~3–4 hr settlement, 0.01 BTC minimum. MUSD accepts only BTC/tBTC as collateral. Confirmed by Chainwire announcement, May 2025.
- **Testnet (matsnet):** Bridging is via the matsnet portal, which mints synthetic "matsnet BTC" from the faucet. Not real Bitcoin-testnet bridged via Threshold.

For mezoCircles: demo flows on testnet use faucet BTC. Mainnet docs/demo should show the canonical Threshold bridge path.

## 4. veMEZO / gauges

`ve(3,3)` system shipped on Mezo Earn.

- `veBTC` = base vote weight, `veMEZO` = up to 5× boost.
- Weekly MEZO emissions allocated by gauge votes.
- MUSD Savings Vault (sMUSD) is a gauge-eligible pool.
- Aerodrome integration live.
- MEZO mainnet token: `0x7B7c000000000000000000000000000000000001`.

veMEZO contract addresses not in public docs at time of audit — pull from `explorer.mezo.org` before integrating.

## Sources

- https://mezo.org/docs/users/musd/
- https://mezo.org/docs/users/musd/architecture-and-terminology/
- https://mezo.org/docs/developers/musd/musd-redemptions
- https://mezo.org/docs/users/resources/contracts-reference/
- https://github.com/mezo-org/musd
- https://mezo.org/docs/users/mainnet/bridges/
- https://mezo.org/blog/how-mezo-wraps-btc-a-guide-to-tbtc/
- https://chainwire.org/2025/05/30/tbtc-becomes-first-to-power-gas-fees-and-collateral-on-mezo/
- https://chainlist.org/chain/31611
- https://explorer.test.mezo.org/
- https://faucet.test.mezo.org/
- https://mezo.org/blog/welcome-to-matsnet-alpha
- https://mezo.org/docs/developers/getting-started/
- https://mezo.org/blog/mezo-earn-a-ve-3-3-system-for-bitcoin-lending
- https://mezo.org/blog/how-gauges-and-splitters-work-on-mezo
- https://mezo.org/blog/understanding-vemezo
- https://mezo.org/blog/earn-stablecoin-yield-with-the-musd-savings-vault
- https://docs.pimlico.io/guides/supported-chains
- https://docs.threshold.network/contract-addresses/tbtc
