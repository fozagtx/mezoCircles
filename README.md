# mezoCircles

One-click Mezo Trove manager. Deposit BTC, mint MUSD, hold yield-bearing savings — without juggling hints, fee bounds, or trove bookkeeping.

## What this is

`MezoCirclesVault` is a per-user smart contract that owns a single Mezo MUSD Trove on behalf of its owner. The owner gets four operations — `openVault`, `addCollateral`, `repayDebt`, `closeVault` — instead of the raw Liquity-v2-fork surface. Future work bolts on auto-yield routing (MUSD → MUSD Savings Vault) and a keeper that auto-repays debt from yield.

The hackathon scope is intentionally narrow. See `docs/research/mezo-validation.md` for the validated facts about Mezo that informed which features are in v1 vs deferred.

## Scope (week 1)

- [x] `MezoCirclesVault.sol` — per-user vault wrapping Mezo `BorrowerOperations`
- [x] Mock-based unit tests (7/7 passing)
- [x] Deploy script targeting Mezo testnet
- [x] Mezo capability audit (`docs/research/mezo-validation.md`)
- [x] Mezo testnet deploy + manual e2e test
- [x] Frontend
- [ ] Auto-yield keeper (deferred to week 3)
- [ ] Account abstraction / passkeys (cut from v1 — no Mezo support)

## Known constraints (validated against Mezo deployment)

- **Min debt per Trove: 1,800 MUSD.** Cannot serve sub-$2k positions.
- **Interest rate: 1–5% APR**, locked at open. Not "1% flat" as some marketing implies.
- **Redemption fee: 0.75%** on BTC received.
- **No ERC-4337 on Mezo today.** mezoCircles uses EOA wallets (MetaMask/UniSat/Xverse + Mezo Passport connector). BTC pays gas natively.
- **Testnet BTC is faucet-issued**, not bridged real BTC via Threshold. Mainnet uses the canonical tBTC bridge.

## Repository layout

```
contracts/         Foundry project — MezoCirclesVault.sol + interfaces + tests
docs/research/     Validation notes informing scope decisions
.env.example       Mezo RPC + MUSD/BorrowerOperations/TroveManager addresses
```

## Quickstart

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit   # first time only
forge build
forge test
```

Deploy to Mezo testnet:

```bash
cp .env.deploy.example .env.deploy        # then fill MEZOCIRCLES_VAULT_OWNER + DEPLOYER_PRIVATE_KEY
bash scripts/deploy-testnet.sh            # dry-run (no broadcast, balance check only)
bash scripts/deploy-testnet.sh --broadcast
bash scripts/finalize-deploy.sh 0x<deployed-vault-address>            # verify + patch README
bash scripts/finalize-deploy.sh 0x<deployed-vault-address> --commit   # also commit broadcast artifact

# Once the vault is deployed, open your Trove (min debt 1,800 MUSD, min ICR 110%):
bash scripts/open-vault.sh 0x<vault-address> 1 1800   # 1 BTC collateral, 1,800 MUSD debt
```

To verify the integration before broadcasting real txs, run the fork test against
the live Mezo testnet:

```bash
MEZO_TESTNET_RPC_URL=https://rpc.test.mezo.org \
  forge test --match-contract MezoCirclesVaultForkTest \
  --fork-url $MEZO_TESTNET_RPC_URL -vv
```

`.env.deploy` is gitignored. Never commit a private key.

## Deployments

| Network | MezoCirclesVault | Owner | Block | Tx |
|---|---|---|---|---|
| Mezo testnet (31611) | `0x073F9b59442e63f03b96D2aDe16dc37d40929e20` | `0xBb67c7386e1e4Fb9931129CA09FE577F4B3fFb97` | 13255204 | `0x88d70480ddfb44d90e707f21e3466100164a899023f35db1590794cd10a4973d` |

Manual e2e open-vault check: `0x01fb54dbc006c09d6a4b53cb9c0f7d575289f88f9278e479e7ab311d64412327`
opened a live Mezo testnet Trove with 0.001 BTC collateral. The vault forwarded 1,800 MUSD
to the owner wallet; the on-chain Trove debt reads higher because Mezo adds protocol debt/fees
on top of the borrowed amount.

## History

The project was originally an on-chain ROSCA (savings circles) on Mezo. Refocused to a per-user Mezo MUSD Trove autopilot on 2026-05-20. The pre-refocus ROSCA codebase is preserved at the git tag `archive/mezo-circles-2026-05-20`.
