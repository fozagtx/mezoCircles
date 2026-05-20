// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MezoCirclesVault} from "../src/MezoCirclesVault.sol";

/// @notice Deploys a single MezoCirclesVault instance for the caller against the
///         Mezo Trove suite. For a per-user factory, see future work.
/// @dev    Required env vars:
///           MEZO_BORROWER_OPS         e.g. 0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba
///           MEZO_TROVE_MANAGER        e.g. 0x7FE0A5a7EeBD88530c58824475edEae33424671F
///           MEZO_MUSD                 e.g. 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 (testnet)
///           MEZOCIRCLES_VAULT_OWNER   address that will own the deployed vault
///         Verify all addresses against explorer.test.mezo.org before
///         deploying to mainnet — the testnet set above is from the
///         scale-test deployment manifest, not necessarily the canonical
///         matsnet set.
contract DeployMezoCirclesVault is Script {
    function run() external returns (MezoCirclesVault vault) {
        address borrowerOps = vm.envAddress("MEZO_BORROWER_OPS");
        address troveManager = vm.envAddress("MEZO_TROVE_MANAGER");
        address musd = vm.envAddress("MEZO_MUSD");
        address owner = vm.envAddress("MEZOCIRCLES_VAULT_OWNER");

        vm.startBroadcast();
        vault = new MezoCirclesVault(owner, borrowerOps, troveManager, musd);
        vm.stopBroadcast();
    }
}
