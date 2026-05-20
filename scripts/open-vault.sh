#!/usr/bin/env bash
# Open the Trove on a deployed AuraVault. Run AFTER the vault is deployed.
# Usage:
#   bash scripts/open-vault.sh 0x<vault-address> <btc-collateral> <musd-debt>
#
# Examples:
#   # 1 BTC collateral, 1800 MUSD debt (Trove minimum)
#   bash scripts/open-vault.sh 0xVAULT... 1 1800
#
#   # 0.5 BTC collateral, 5000 MUSD debt
#   bash scripts/open-vault.sh 0xVAULT... 0.5 5000
#
# Constraints (from Mezo MUSD docs + live verification):
#   - Minimum debt per Trove: 1,800 MUSD
#   - Minimum collateral ratio (ICR): 110%
#   - Recovery Mode at TCR < 150%
#   - Interest is governed protocol-wide by InterestRateManager (1-5% APR)
#
# This script does NO safety math beyond shape validation. You are responsible
# for ensuring (collateral * BTC_price) / debt >= 110%.

set -euo pipefail

VAULT="${1:-}"
BTC_AMOUNT="${2:-}"
MUSD_DEBT="${3:-}"

if [ -z "$VAULT" ] || [ -z "$BTC_AMOUNT" ] || [ -z "$MUSD_DEBT" ]; then
  echo "❌ usage: bash scripts/open-vault.sh 0x<vault> <btc-collateral> <musd-debt>" >&2
  exit 1
fi
if ! [[ "$VAULT" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
  echo "❌ '$VAULT' is not a 0x... address" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f .env.deploy ]; then
  echo "❌ .env.deploy not found — needed for DEPLOYER_PRIVATE_KEY + RPC" >&2
  exit 1
fi
# shellcheck source=/dev/null
source .env.deploy
RPC_URL="${MEZO_TESTNET_RPC_URL:-https://rpc.test.mezo.org}"

BTC_WEI="$(cast --to-wei "$BTC_AMOUNT" ether)"
MUSD_WEI="$(cast --to-wei "$MUSD_DEBT" ether)"

# Sanity: enforce protocol minimum
MIN_DEBT_WEI="$(cast --to-wei 1800 ether)"
if [ "$(echo "$MUSD_WEI < $MIN_DEBT_WEI" | bc 2>/dev/null || python3 -c "import sys; print(int(int($MUSD_WEI) < int($MIN_DEBT_WEI)))")" = "1" ]; then
  echo "❌ MUSD debt must be >= 1800 (got $MUSD_DEBT)" >&2
  exit 1
fi

# Confirm vault owner matches our caller, otherwise the call will revert with NotOwner.
DEPLOYER_ADDR="$(cast wallet address --private-key "$DEPLOYER_PRIVATE_KEY")"
VAULT_OWNER="$(cast call "$VAULT" "owner()(address)" --rpc-url "$RPC_URL")"
if [ "${DEPLOYER_ADDR,,}" != "${VAULT_OWNER,,}" ]; then
  echo "❌ Vault owner is $VAULT_OWNER but DEPLOYER_PRIVATE_KEY belongs to $DEPLOYER_ADDR" >&2
  exit 1
fi

echo "▶ Vault:        $VAULT"
echo "▶ Caller:       $DEPLOYER_ADDR (matches vault owner ✓)"
echo "▶ Collateral:   $BTC_AMOUNT BTC ($BTC_WEI wei)"
echo "▶ Debt:         $MUSD_DEBT MUSD ($MUSD_WEI wei)"
echo "▶ Hints:        address(0), address(0)   (fine for first/sparse Trove)"
echo ""
read -r -p "Proceed with broadcast? [y/N] " ok
if [ "${ok,,}" != "y" ]; then
  echo "aborted."
  exit 0
fi

cast send "$VAULT" \
  "openVault(uint256,address,address)" \
  "$MUSD_WEI" \
  "0x0000000000000000000000000000000000000000" \
  "0x0000000000000000000000000000000000000000" \
  --value "$BTC_WEI" \
  --rpc-url "$RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY"

echo ""
echo "✅ openVault tx sent. Read state with:"
echo "   cast call $VAULT 'vaultPosition()(uint256,uint256,uint256)' --rpc-url $RPC_URL"
