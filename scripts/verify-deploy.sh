#!/usr/bin/env bash
# Sanity-check a deployed AuraVault on Mezo testnet.
# Usage: bash scripts/verify-deploy.sh 0x<deployed-vault-address>
set -euo pipefail

VAULT="${1:-}"
if [ -z "$VAULT" ]; then
  echo "❌ usage: bash scripts/verify-deploy.sh 0x<deployed-vault-address>" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env.deploy ]; then
  echo "❌ .env.deploy not found — needed to know expected owner/addresses" >&2
  exit 1
fi
# shellcheck source=/dev/null
source .env.deploy

RPC_URL="${MEZO_TESTNET_RPC_URL:-https://rpc.test.mezo.org}"

echo "▶ Verifying AuraVault at $VAULT on $RPC_URL"
echo ""

OWNER_ONCHAIN="$(cast call "$VAULT" "owner()(address)" --rpc-url "$RPC_URL")"
BORROWER_OPS_ONCHAIN="$(cast call "$VAULT" "borrowerOps()(address)" --rpc-url "$RPC_URL")"
TROVE_MANAGER_ONCHAIN="$(cast call "$VAULT" "troveManager()(address)" --rpc-url "$RPC_URL")"
MUSD_ONCHAIN="$(cast call "$VAULT" "musd()(address)" --rpc-url "$RPC_URL")"
STATUS_ONCHAIN="$(cast call "$VAULT" "vaultStatus()(uint256)" --rpc-url "$RPC_URL")"
DEBT_ONCHAIN="$(cast call "$VAULT" "vaultDebt()(uint256)" --rpc-url "$RPC_URL")"
COLL_ONCHAIN="$(cast call "$VAULT" "vaultCollateral()(uint256)" --rpc-url "$RPC_URL")"

echo "owner               $OWNER_ONCHAIN"
echo "borrowerOps         $BORROWER_OPS_ONCHAIN"
echo "troveManager        $TROVE_MANAGER_ONCHAIN"
echo "musd                $MUSD_ONCHAIN"
echo "vaultStatus         $STATUS_ONCHAIN   (0=nonExistent expected pre-openVault)"
echo "vaultDebt           $DEBT_ONCHAIN"
echo "vaultCollateral     $COLL_ONCHAIN"
echo ""

ok=0
fail=0
lc() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
check() {
  local label="$1" expected="$2" actual="$3"
  if [ "$(lc "$expected")" = "$(lc "$actual")" ]; then
    echo "✅ $label matches expected"
    ok=$((ok+1))
  else
    echo "❌ $label mismatch — expected $expected, got $actual"
    fail=$((fail+1))
  fi
}
check "owner"          "$AURA_VAULT_OWNER"     "$OWNER_ONCHAIN"
check "borrowerOps"    "$MEZO_BORROWER_OPS"    "$BORROWER_OPS_ONCHAIN"
check "troveManager"   "$MEZO_TROVE_MANAGER"   "$TROVE_MANAGER_ONCHAIN"
check "musd"           "$MEZO_MUSD"            "$MUSD_ONCHAIN"

echo ""
echo "Result: $ok passed, $fail failed"
[ "$fail" -eq 0 ]
