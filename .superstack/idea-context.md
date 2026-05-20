# Idea Context — mezoCircles

## Idea

A per-user Mezo MUSD Trove manager that wraps `BorrowerOperations` so individual borrowers get one-click `openVault` / `addCollateral` / `repayDebt` / `closeVault` operations instead of having to compute hints, choose fee bounds, and manage interest rates manually. v2 adds auto-yield routing (idle MUSD → Mezo's MUSD Savings Vault) and a keeper that uses harvested yield to chip away at debt principal — making BTC collateral "pay for itself."

Target user: retail Bitcoin holders on Mezo who want stable liquidity (MUSD) without selling BTC, and who don't want to manage Liquity-v2-fork mechanics directly. Distinct from TrovePilot (liquidation keepers) and Sense/Perseus (institutional yield vaults).

## Validation — 2026-05-20

```json
{
  "validation": {
    "demand_signals": [
      "TrovePilot (Mezo hackathon winner) addresses adjacent Trove-automation problem — proves the category has real demand and ecosystem visibility",
      "Mezo Alpha Builder Program + Supernormal Foundation offer funding/support for MUSD utility builders — budget behind the need",
      "Institutional BTC vaults (Sense & Perseus) live with Anchorage + Bullish (250 BTC deployed April 2026) — large-cap thesis validated; retail equivalent unaddressed",
      "Mezo 2026 roadmap calls for ecosystem dApps building on MUSD — first-party signal of demand for tools in this layer",
      "Hackathon track 'Bank on Bitcoin / MEZO Utilization' explicitly invites this category"
    ],
    "risks": [
      { "category": "market", "description": "TrovePilot could extend from liquidation keepers into borrow-side automation, collapsing mezoCircles's differentiation", "severity": "high" },
      { "category": "market", "description": "Sense/Perseus or Mezo first-party could launch a retail-grade Trove manager — they have audience advantage", "severity": "medium" },
      { "category": "technical", "description": "MezoCirclesVault's interfaces are skeletal — Mezo's BorrowerOperations may diverge from canonical Liquity v2 ABI; needs forking-test against live contracts before mainnet", "severity": "medium" },
      { "category": "market", "description": "1800 MUSD min Trove debt cuts off the freelancer-rent-money use case the original pitch leaned on", "severity": "medium" },
      { "category": "regulatory", "description": "Acting as an intermediary that opens debt positions on behalf of users may attract regulatory attention. Mitigated by non-custodial design but blurs once a factory + relayer ships", "severity": "low" },
      { "category": "team", "description": "Founder-fit unknown — no validation that the user has prior DeFi shipping experience, Mezo audience, or domain credibility", "severity": "unknown" }
    ],
    "go_no_go": "go",
    "confidence": 0.62,
    "next_steps": [
      "Talk to 5 Mezo testnet users (Discord, Twitter @MezoNetwork replies) before building frontend — ask 'how are you managing your Trove today?' not 'would you use mezoCircles?'",
      "Apply to Mezo Alpha Builder Program / Supernormal Foundation — there is real money behind this and you should take it",
      "Position explicitly AGAINST TrovePilot in pitch: mezoCircles = borrow + yield automation for individual users; TrovePilot = liquidation keepers for the protocol",
      "Run integration test that opens a real Trove via MezoCirclesVault on Mezo testnet — confirm BorrowerOperations ABI matches our interfaces before week-2 work",
      "Decide whether to ship v2 features (yield routing + auto-repay) before or after frontend; recommend frontend FIRST so user research has something tangible to react to",
      "Integration-first check: MezoCirclesVault is already a thin wrapper over BorrowerOperations + (planned) sMUSD savings vault — this is the right architecture. Do NOT build custom CDP logic; keep wrapping",
      "Cut from v1: ERC-4337 / passkey UX, Wormhole NTT, in-network invoices, cross-chain settlement (per docs/research/mezo-validation.md)"
    ],
    "crypto_necessary": true,
    "integration_first": true,
    "scorecard": {
      "demand_evidence": "moderate-to-strong",
      "competition_level": "sparse (TrovePilot adjacent, no direct retail Trove wrapper)",
      "technical_feasibility": "straightforward (v0 contract already passes 7/7 tests)",
      "time_to_mvp": "2-3 weeks (contract done; frontend + keeper remain)",
      "go_criteria_met": "4 of 5 (demand >= 2 ✅, feasibility ✅, time to MVP ✅, crypto necessary ✅, unfair advantage UNKNOWN)"
    }
  }
}
```

## Verdict: GO — but the validation that matters now is user research, not more code

The contract foundation is sound. The category has visible ecosystem demand and an active funding source. But you have **zero direct evidence** that retail Mezo users have asked for this specific product. Before sinking another two weeks into the frontend and keeper, spend two days talking to 5 actual users.

If you can't find 5 Mezo testnet users with Troves who'll talk to you, that's a signal — the user base might be too small or too institutional to warrant a retail-flavored product. Pivot suggestion in that case: reposition as a **dev tool / SDK** for teams building on Mezo, not a consumer product.
