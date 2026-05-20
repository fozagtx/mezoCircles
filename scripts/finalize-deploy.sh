#!/usr/bin/env bash
# Close the deploy loop:
#   1. verify view fns on the deployed MezoCirclesVault
#   2. fill the README.md Deployments table row with the address + tx + block
#   3. (optional --commit) stage README.md + contracts/broadcast/ and commit
#
# Usage:
#   bash scripts/finalize-deploy.sh 0x<vault-address>                 # verify + README only
#   bash scripts/finalize-deploy.sh 0x<vault-address> --commit        # also commit
#
# Tx hash + block are read from the latest Foundry broadcast file for the
# Mezo testnet chainId 31611, if present. If not present, fields are left as "—".
set -euo pipefail

VAULT="${1:-}"
DO_COMMIT="${2:-}"
if [ -z "$VAULT" ]; then
  echo "❌ usage: bash scripts/finalize-deploy.sh 0x<vault-address> [--commit]" >&2
  exit 1
fi
if ! [[ "$VAULT" =~ ^0x[a-fA-F0-9]{40}$ ]]; then
  echo "❌ '$VAULT' is not a 0x... 40-hex address" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# --- 1. verify ---
echo "▶ Step 1/3 — verify deployed MezoCirclesVault"
bash scripts/verify-deploy.sh "$VAULT"
echo ""

# --- 2. read tx + block from broadcast artifact (best-effort) ---
BROADCAST_FILE="contracts/broadcast/DeployMezoCirclesVault.s.sol/31611/run-latest.json"
TX_HASH="—"
BLOCK="—"
if [ -f "$BROADCAST_FILE" ]; then
  if command -v jq >/dev/null 2>&1; then
    TX_HASH="$(jq -r '.transactions[0].hash // "—"' "$BROADCAST_FILE")"
    BLOCK_RAW="$(jq -r '.receipts[0].blockNumber // "—"' "$BROADCAST_FILE")"
    if [ "$BLOCK_RAW" != "—" ]; then
      # Foundry stores block as 0x-hex string; convert to decimal.
      BLOCK="$(python3 -c "print(int('$BLOCK_RAW', 0))")"
    fi
  else
    echo "⚠️  jq not installed — tx hash + block will be left blank. brew install jq to auto-fill."
  fi
else
  echo "⚠️  $BROADCAST_FILE not found — tx hash + block left blank."
fi

# --- 3. patch README Deployments table ---
echo "▶ Step 2/3 — patch README.md Deployments row"
if [ ! -f .env.deploy ]; then
  echo "❌ .env.deploy not found — needed to read MEZOCIRCLES_VAULT_OWNER" >&2
  exit 1
fi
# shellcheck source=/dev/null
source .env.deploy
OWNER="${MEZOCIRCLES_VAULT_OWNER}"

# Use python for the in-place edit — sed quoting across platforms is a minefield.
python3 - "$VAULT" "$OWNER" "$BLOCK" "$TX_HASH" <<'PY'
import sys, pathlib
vault, owner, block, tx = sys.argv[1:5]
p = pathlib.Path("README.md")
src = p.read_text()
old_row = "| Mezo testnet (31611) | _(awaiting first deploy)_ | — | — | — |"
new_row = f"| Mezo testnet (31611) | `{vault}` | `{owner}` | {block} | `{tx}` |"
if old_row in src:
    p.write_text(src.replace(old_row, new_row))
    print("✅ README.md Deployments row updated")
else:
    # idempotent: if the row already shows a vault, just print what we'd set
    print(f"⚠️  README.md does not contain the placeholder row. Set manually:")
    print(f"   {new_row}")
PY

# --- 4. optional commit ---
echo ""
echo "▶ Step 3/3 — commit"
if [ "$DO_COMMIT" = "--commit" ]; then
  git add README.md
  if [ -d contracts/broadcast ]; then
    git add contracts/broadcast
  fi
  git status --short
  git commit -m "feat(deploy): MezoCirclesVault on Mezo testnet at ${VAULT}

tx:    ${TX_HASH}
block: ${BLOCK}
owner: ${OWNER}"
  echo ""
  git log --oneline -1
else
  echo "(skipped — pass --commit to stage + commit README.md + contracts/broadcast/)"
fi
