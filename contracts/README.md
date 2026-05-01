# mezoCircles Contracts

Foundry project. Five contracts:

| | |
|---|---|
| `SavingsCircle.sol`        | Per-circle ROSCA logic. Deployed as **EIP-1167 clones**. |
| `SavingsCircleFactory.sol` | Spawns clones, indexes by creator/member, authorizes new circles to write to reputation/badge contracts. |
| `ReputationSystem.sol`     | XP, ranks (Bronze→Diamond), daily-quest streaks, referrals. |
| `AchievementBadge.sol`     | Soulbound ERC-721 badges (FirstDeposit, Streak7, Streak30, CircleCompleted, FiveCircles, TenCircles). |

## Setup

```bash
forge install foundry-rs/forge-std --no-commit
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge build
forge test -vv
```

## Deploy to Mezo testnet

```bash
cp .env.example .env
# fill in PRIVATE_KEY (a key with testnet BTC)
source .env
forge script script/Deploy.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  --legacy
```

The script prints the four deployed addresses. Paste them into `web/.env.local` and `bot/.env`.

## Faucet

Get testnet BTC from the Mezo Matsnet faucet linked in https://mezo.org/docs.
