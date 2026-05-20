#!/usr/bin/env bash
# Deploys AuraVault to Mezo testnet.
# Usage:
#   1. cp .env.deploy.example .env.deploy
#   2. Edit .env.deploy — fill AURA_VAULT_OWNER + DEPLOYER_PRIVATE_KEY
#   3. bash scripts/deploy-testnet.sh           # dry-run (no broadcast)
#   4. bash scripts/deploy-testnet.sh --broadcast    # send the tx
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env.deploy ]; then
  echo "❌ .env.deploy not found. Copy .env.deploy.example to .env.deploy and fill it in." >&2
  exit 1
fi
# shellcheck source=/dev/null
source .env.deploy

: "${MEZO_BORROWER_OPS:?missing in .env.deploy}"
: "${MEZO_TROVE_MANAGER:?missing in .env.deploy}"
: "${MEZO_MUSD:?missing in .env.deploy}"
: "${AURA_VAULT_OWNER:?missing in .env.deploy}"
: "${DEPLOYER_PRIVATE_KEY:?missing in .env.deploy}"

RPC_URL="${MEZO_TESTNET_RPC_URL:-https://rpc.test.mezo.org}"
BROADCAST_FLAG="${1:-}"

echo "▶ Mezo testnet RPC:   $RPC_URL"
echo "▶ BorrowerOperations: $MEZO_BORROWER_OPS"
echo "▶ TroveManager:       $MEZO_TROVE_MANAGER"
echo "▶ MUSD:               $MEZO_MUSD"
echo "▶ Vault owner:        $AURA_VAULT_OWNER"

DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"
DEPLOYER_BAL_WEI="$(cast balance "$DEPLOYER_ADDR" --rpc-url "$RPC_URL")"
DEPLOYER_BAL_BTC="$(cast --from-wei "$DEPLOYER_BAL_WEI")"
echo "▶ Deployer:           $DEPLOYER_ADDR"
echo "▶ Deployer balance:   $DEPLOYER_BAL_BTC BTC"

if [ "$DEPLOYER_BAL_WEI" = "0" ]; then
  echo "❌ Deployer has zero BTC. Faucet first: https://faucet.test.mezo.org/" >&2
  exit 1
fi

cd contracts
if [ "$BROADCAST_FLAG" = "--broadcast" ]; then
  echo "🚀 Broadcasting deploy..."
  forge script script/DeployAuraVault.s.sol:DeployAuraVault \
    --rpc-url "$RPC_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY" \
    --broadcast
else
  echo "🔍 Dry-run (no broadcast). Re-run with --broadcast to send the tx."
  forge script script/DeployAuraVault.s.sol:DeployAuraVault \
    --rpc-url "$RPC_URL" \
    --private-key "$DEPLOYER_PRIVATE_KEY"
fi
