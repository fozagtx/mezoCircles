# mezoCircles — Project Memory

Long-lived context for the project. Decisions, why, and current state. Not a journal — keep it short and load-bearing.

---

## What this is

On-chain ROSCA (rotating savings circles) on **Mezo testnet** (chainId `31611`, BTC native gas, RPC `https://rpc.test.mezo.org`). Members pool a fixed contribution each cycle; one member receives the full pot per cycle in rotation. Optional ERC-20 (mUSD) mode and ERC-4626 yield vault hook per circle.

## Repo layout (intentional, not a monorepo)

```
mezoCircles/
├── contracts/   # Foundry — SavingsCircle (clone), Factory, Reputation, Badge
├── web/         # Next.js 14 — wagmi v2, Tailwind, Framer Motion
├── bot/         # Grammy Telegram bot, block-poller for events
└── AGENTS.md    # Agent guide
```

Three sibling folders. No workspace tooling. No root `package.json`. Each folder installs and runs from inside.

## Core architectural decisions

| Decision | Why |
|---|---|
| **EIP-1167 clones via factory** | Cheap per-circle deployment; one impl + N proxies. |
| **Pull-pattern payouts** (`pendingPayout` + `claimPayout`) | A non-receivable recipient cannot brick the circle. (Fix for H-1.) |
| **`abort()` after `cycleDeadline + 7 days`** | Escape hatch if the circle stalls. Members reclaim principal via `claimRefund()`. (Fix for H-2.) |
| **SafeERC20 throughout** | Handles bool-returning and void-returning ERC-20s uniformly. (Fix for H-3.) |
| **Balance-diff guard in `deposit()`** | Catches fee-on-transfer / rebasing tokens loudly. (Fix for M-1.) |
| **mUSD + yield vault via env, not hardcoded** | Real Mezo testnet addresses get filled by the operator; UI gates with `MUSD_AVAILABLE` / `YIELD_VAULT_AVAILABLE` flags. |
| **`prevrandao` shuffle** | Hackathon-grade; flagged in code (M-2). Production must use commit-reveal or VRF. |
| **Inline reentrancy guard** | Clone-safe (no constructor needed). |
| **Soulbound badge** | `_update` reverts on non-mint transfers. |
| **`CONTRACTS_DEPLOYED` gate on hooks** | Avoid stuck-loading on zero-address placeholders before deploy. |
| **`isMounted` SSR guard on `ConnectButton`** | Prevents hydration mismatch on the wallet UI. |

## Brand system (current)

| Token | Value | Use |
|---|---|---|
| `cream` | `#F5F0E0` | Page background |
| `cream-soft` | `#FAF6E9` | Card surfaces |
| `brown` | `#1A1200` | Primary text, dark sections |
| `acid` | `#C8FF00` | Hero CTA, nav active pill |
| `amber` | `#F5C432` | Reserved (cards section) |
| `purple` | `#2D1B6B` | Reserved (in-app surfaces) |

Type pair: **Fraunces** (display, weight 900, condensed editorial serif) + **Inter** (body). JetBrains Mono retired. Legacy `brand-red` / `brand-black` Tailwind tokens still resolve — they alias to acid + brown so existing references keep working.

Voice: direct, editorial, anti-establishment. Lowercase wordmark `mezocircles`. The headline pattern is poster-size serif with one ghost-text emphasis word. Generous whitespace; nothing sharp-cornered.

## What's deployed / configured

| Surface | State |
|---|---|
| `contracts/` | Compiled, **11/11 tests pass**. Not yet deployed to Mezo testnet from this branch. |
| `web/` | Type-checks (modulo two pre-existing slot-narrowing TS errors). Brand redesign on `home` + `Shell` shipped; detail pages inherit tokens. |
| `bot/` | Untouched in recent rounds; needs the deployed factory/rep/badge addresses. |
| `web/.env.local` | Not committed. Operator fills `NEXT_PUBLIC_FACTORY_ADDRESS`, `_REPUTATION_ADDRESS`, `_BADGE_ADDRESS`, `_MUSD_ADDRESS`, `_YIELD_VAULT_ADDRESS`. |
| GitHub | Pushed to `https://github.com/fozagtx/mezoCircles` as `main`, commit `da8a5ab` ("first commit"). |

## What we explicitly do NOT do

- **No mocks.** No fake circles, fake reputation, fake badges in the UI. Empty states are honest.
- **Not a Telegram Mini App.** Responsive web app, desktop + mobile. Telegram script removed.
- **No co-author trailer on commits.** Plain commit messages, no `Co-Authored-By`.
- **No over-architecture.** No workspace tooling, no premature abstractions. Three similar lines beats a premature helper.
- **No comments unless WHY is non-obvious.** Identifiers explain *what*; comments explain hidden constraints only.
- **No mainnet yet.** This is a hackathon submission targeting Mezo testnet only.
