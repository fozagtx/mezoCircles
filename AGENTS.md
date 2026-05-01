# mezoCircles — Agent guide

On-chain ROSCA (rotating savings circles) on Mezo testnet. This file orients AI coding agents working in the repo.

## Repo layout

Three sibling folders, each independent (no workspace tooling — no root `package.json`):

- `contracts/` — Foundry/Solidity. Factory + clones + reputation + soulbound badge.
- `web/` — Next.js 14 frontend (App Router, wagmi v2, viem, Tailwind, Framer Motion).
- `bot/` — Grammy Telegram bot, block-poller for on-chain events.

Each folder is self-contained. Install/build/run from inside the folder you're working in.

## Chain

Mezo testnet — chainId `31611`, RPC `https://rpc.test.mezo.org`, explorer `https://explorer.test.mezo.org`. Native gas token is **BTC**, not ETH.

## Contracts

- `SavingsCircleFactory.sol` — spawns `SavingsCircle` clones via EIP-1167. Indexes circles by creator and member. Authorizes each new circle to write to reputation/badge.
- `SavingsCircle.sol` — per-circle clone. Inline reentrancy guard (clone-safe). Fisher-Yates shuffle for payout order using `prevrandao` (hackathon-grade, not production randomness). Statuses: `Pending` → `Active` → `Completed`. Supports two contribution modes (set per circle at creation):
  - **Native BTC** — `token = 0x0`, `deposit()` is payable, payouts via `call{value}`.
  - **ERC-20 (mUSD)** — `token = mUSD address`, members `approve()` then `deposit()` (msg.value=0); contract uses `transferFrom` and pays out via `transfer`.
  - **Optional yield** — when `yieldVault` is non-zero (must be ERC-4626, asset must match `token`), each deposit is auto-staked. `settleCycle()` redeems all shares before payout, so the recipient gets principal + accrued yield. Yield only available for ERC-20 circles, not native BTC.
- `ReputationSystem.sol` — XP system. +10 deposit, -25 missed, +100 circle complete, +5 daily quest, +50 referral. Ranks: Bronze (0+), Silver (200+), Gold (750+), Platinum (2000+), Diamond (5000+).
- `AchievementBadge.sol` — soulbound ERC-721 (override `_update` to revert non-mint transfers). 6 badge types, each earnable once via `hasBadge` mapping.

Build / test:

```sh
cd contracts
forge build
forge test
```

Deploy:

```sh
cd contracts
forge script script/Deploy.s.sol --rpc-url https://rpc.test.mezo.org --broadcast --private-key <KEY>
```

After deploy, copy the three addresses into `web/.env.local`:

```
NEXT_PUBLIC_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
NEXT_PUBLIC_BADGE_ADDRESS=0x...
```

**Mezo banking integrations (testnet).** mUSD and the yield vault are configured via env, not hardcoded — we don't ship fake addresses. Until the real Mezo testnet addresses are filled in, the UI keeps the mUSD button disabled and only allows native-BTC circles:

```
NEXT_PUBLIC_MUSD_ADDRESS=0x...           # Mezo testnet mUSD
NEXT_PUBLIC_YIELD_VAULT_ADDRESS=0x...    # ERC-4626 vault whose .asset() == mUSD
```

The vault must be ERC-4626 and its `asset()` must equal `NEXT_PUBLIC_MUSD_ADDRESS`, otherwise `initialize()` reverts with `VaultAssetMismatch`.

## Web

Stack: Next.js 14 App Router, wagmi v2, viem, Tailwind, Framer Motion, JetBrains Mono.

Design tokens live in `web/src/app/globals.css`. Brand red `#E5322D`, brand black `#1A1A18`, warm off-white background. Pill buttons, 8px radius. Don't introduce a different visual language.

```sh
cd web
npm install
npm run dev   # http://localhost:3000
```

### Key files

- `web/src/lib/wagmi.ts` — wagmi config + contract address exports + `CONTRACTS_DEPLOYED` flag.
- `web/src/lib/chain.ts` — Mezo testnet chain object.
- `web/src/lib/abis.ts` — typed ABIs.
- `web/src/hooks/useCircles.ts`, `useReputation.ts` — wagmi read hooks.
- `web/src/components/Shell.tsx` — responsive shell (top-nav desktop, bottom-tab mobile).
- `web/src/components/ConnectButton.tsx` — wallet connect (with `isMounted` SSR guard).

### Feature gates

- `CONTRACTS_DEPLOYED` — true only when factory/reputation/badge are all non-zero.
- `MUSD_AVAILABLE` — true only when `NEXT_PUBLIC_MUSD_ADDRESS` is non-zero. Gates the mUSD asset button on the create-circle form.
- `YIELD_VAULT_AVAILABLE` — true only when both mUSD and `NEXT_PUBLIC_YIELD_VAULT_ADDRESS` are non-zero. Gates the "earn yield on idle pot" toggle.

### CONTRACTS_DEPLOYED gate

Before deployment, `FACTORY_ADDRESS` / `REPUTATION_ADDRESS` / `BADGE_ADDRESS` default to the zero address. Hooks would otherwise call a non-existent contract and stick on "loading" forever.

Every wagmi read hook touching our contracts MUST gate `query.enabled` on `CONTRACTS_DEPLOYED`:

```ts
import { CONTRACTS_DEPLOYED } from "@/lib/wagmi";

useReadContract({
  // ...
  query: { enabled: CONTRACTS_DEPLOYED && Boolean(address) },
});
```

When adding a new contract hook, copy this pattern.

### Layout rules

- This is a **responsive web app**, not a Telegram Mini App. Build for desktop AND mobile.
- Top nav (`md:flex`) on desktop, bottom tab nav (`md:hidden`) on mobile.
- Shell uses `max-w-6xl`; inner content uses `max-w-2xl md:max-w-none`.
- Hero scales `text-3xl md:text-5xl lg:text-6xl`.

## Bot

Grammy Telegram bot. Block-polls Mezo for `CircleCreated`, `Deposited`, `PayoutClaimed`, `MemberDefaulted`, `CircleCompleted` events and pings linked Telegram chats. JSON file storage for chat→wallet bindings.

```sh
cd bot
npm install
npm run dev
```

Env: `BOT_TOKEN`, plus the same three contract addresses.

## Conventions

- **No mocks.** Don't seed example circles, fake reputation values, or sample badges in the UI. Empty states are honest empty.
- **No over-architecting.** No workspace tooling, no premature abstractions. Three similar lines beats a premature helper.
- **No comments unless WHY is non-obvious.** Identifiers should explain what; comments explain hidden constraints or surprising invariants.
- **Match scope.** A bug fix doesn't get cleanup churn. Don't refactor adjacent code unprompted.
