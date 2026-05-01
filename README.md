# mezoCircles

On-chain ROSCA savings circles on **Mezo** (Bitcoin L2, EVM-compatible). Friends save BTC together, take turns receiving the pot, and level up with ranks, badges, and XP.

> Inspired by CrediKye — re-architected to use **Mezo BTC as the native gas + savings asset**, so circles are denominated in real BTC, not a wrapped stablecoin.

## Why Mezo

- **Gas token is BTC** — deposits and gas use the same asset; no token-swap friction.
- **Bitcoin-secured EVM** — full Solidity / Foundry / wagmi stack.
- **Instant finality (no reorgs)** — payout rotation is deterministic the moment a block lands.
- **Native bridge** (`0xF6680EA3b480cA2b72D96ea13cCAF2cFd8e6908c`) lets users move BTC ↔ Mezo BTC ↔ Ethereum tBTC without wrapped-token games.

## Architecture

```
mezoCircles/
├── contracts/   Foundry — SavingsCircle (clone), Factory (EIP-1167),
│                ReputationSystem, AchievementBadge (soulbound), UserProfile
├── web/         Next.js 14 + wagmi v2 + viem + Tailwind + Framer Motion
│                Telegram WebApp SDK integration
└── bot/         Grammy Telegram bot — invites, deposit reminders, payout pings
```

## Network

| | Mezo Testnet (matsnet) |
|---|---|
| Chain ID | `31611` |
| RPC | `https://rpc.test.mezo.org` |
| Gas token | BTC |
| Explorer | https://explorer.test.mezo.org |

## Quickstart

```bash
# 1. Contracts
cd contracts
forge install
forge build
forge test
PRIVATE_KEY=0x... forge script script/Deploy.s.sol --rpc-url $MEZO_RPC --broadcast

# 2. Web
cd ../web
pnpm install
cp .env.example .env.local   # paste deployed addresses
pnpm dev

# 3. Telegram bot
cd ../bot
pnpm install
cp .env.example .env         # set BOT_TOKEN + WEBAPP_URL
pnpm dev
```

## Features

- 🎯 Create circles with 3–10 members, fixed contribution, fixed cycle length
- 🔁 Smart-contract-enforced payout rotation (random or join-order)
- ⭐ XP + 5-tier rank system (Bronze → Diamond) tied to deposit history
- 🏆 Soulbound achievement badges (first deposit, 30-day streak, full circle complete)
- 🎁 Referral system: inviter + invitee both earn +50 reputation
- 📱 Telegram Mini App with native share for circle invites
- 🌐 Also runs as a standalone web app
