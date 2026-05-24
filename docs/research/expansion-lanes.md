# Expansion Lanes — Reputation Credit, AI Automation, and RWAs

Status: research/roadmap only. None of this is implemented in v1.

mezoCircles v1 is a simple BTC-backed borrowing app: deposit BTC, borrow MUSD,
repay when ready. That lane matches Mezo's current MUSD design: a Bitcoin-backed
CDP system where borrowers mint MUSD against BTC collateral.

## G. Reputation-based / undercollateralized lending

This does **not** fit the current contract scope.

Current DeFi assumes every borrower is anonymous and risky, so collateral is the
enforcement mechanism. mezoCircles inherits that model from Mezo MUSD: a position
must stay above the protocol collateral ratio or it can be liquidated.

Reputation lending would require a separate credit layer, not a small change to
`MezoCirclesVault`.

Possible inputs:

- onchain credit scores
- wallet repayment history
- income or cash-flow verification
- social graph / entity reputation
- AI risk models

Required infrastructure:

- identity or reputation provider
- privacy-preserving attestations
- underwriting policy
- default handling and collections logic
- legal/compliance review
- separate lending pool willing to take borrower default risk

Good product direction, later:

- start with **reputation as advice**, not credit extension
- show a borrower health score based on collateral ratio, repayment history, and
  wallet behavior
- use AI for position monitoring, not underwriting
- only consider undercollateralized lending after there is a capital pool,
  risk model, and legal path for defaults

## AI-powered automation

This fits better than undercollateralized lending and should be the next serious
product lane after v1.

Useful automations:

- automatic collateral protection alerts
- liquidation-prevention suggestions
- recommended repay/top-up amounts
- autonomous refinancing if Mezo exposes a safe refinance path
- keeper-triggered harvest-and-repay if a future yield route is added

Near-term implementation path:

1. Add health monitoring in the frontend.
2. Add alerts when BTC drop-to-liquidation gets too small.
3. Add "suggested action" copy: add BTC, repay MUSD, or close.
4. Later, add keeper execution only for narrowly permissioned actions.

Do **not** market this as autopilot until the keeper path is deployed and tested.

## RWA lending / yield

RWA does **not** fit v1 directly.

Real-world assets change the story from "degen yield" to "internet-native fixed
income," but they also introduce offchain trust. US Treasuries, invoices, private
credit, and real estate debt require more than an ERC-20 token. They need legal
rights, custody, valuation, default handling, and compliance.

Why RWA is hard here:

- Mezo MUSD is BTC-collateralized today; the deployed flow does not accept RWA
  collateral.
- `MezoCirclesVault` is immutable and owns one BTC-backed Trove. It cannot be
  upgraded into a multi-collateral RWA credit system.
- RWA tokens depend on issuers, custodians, auditors, legal entities, and oracles.
- Many RWA products are securities-like and may require KYC/AML, transfer
  restrictions, disclosures, and jurisdiction-specific rules.

Possible RWA paths:

### 1. RWA yield destination for borrowed MUSD

User borrows MUSD against BTC, then voluntarily deposits some MUSD into an
external, permissioned RWA yield product.

This is the least invasive route, but it is not available until there is a Mezo
compatible RWA product with clear legal/compliance terms.

### 2. RWA-backed repayment strategy

Borrowed MUSD is routed into a conservative yield strategy, and realized yield
is harvested to repay debt over time.

This resembles the existing sMUSD/keeper roadmap more than true RWA lending. It
still needs strategy risk checks, withdrawal liquidity, and failure handling.

### 3. Separate RWA credit product

Build a new product beside mezoCircles where investors fund a pool backed by
invoices, Treasuries, private credit, or real estate debt.

This is a different company/product surface: legal structuring, investor access,
borrower diligence, asset servicing, reporting, and defaults.

## Recommendation

Keep v1 narrow:

> Borrow dollars against your Bitcoin. No selling, no wrapping, no bank.

For the next roadmap:

1. Build liquidation protection and smarter position monitoring.
2. Add optional keeper-based repayment automation only after a safe yield source
   is available.
3. Explore RWA only as a separate research track or optional destination for MUSD,
   not as a claim in the current app.

## Sources

- Mezo MUSD overview: https://mezo.org/docs/users/musd/
- Mezo MUSD architecture: https://mezo.org/docs/users/musd/architecture-and-terminology
- Mezo MUSD concepts: https://mezo.org/docs/users/musd/concepts
- Local validation: `docs/research/mezo-validation.md`
- RWA risk background: tokenized RWAs require legal, custody, oracle, and compliance
  infrastructure beyond normal crypto collateral.
