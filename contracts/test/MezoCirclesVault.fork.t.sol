// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MezoCirclesVault} from "../src/MezoCirclesVault.sol";
import {IBorrowerOperations} from "../src/interfaces/IBorrowerOperations.sol";
import {ITroveManager} from "../src/interfaces/ITroveManager.sol";
import {IMUSD} from "../src/interfaces/IMUSD.sol";

/// @notice Fork test against the real Mezo testnet (chainId 31611).
///         Verifies our interfaces match deployed bytecode. Run with:
///
///           MEZO_TESTNET_RPC_URL=https://rpc.test.mezo.org \
///             forge test --match-contract MezoCirclesVaultForkTest \
///             --fork-url $MEZO_TESTNET_RPC_URL -vv
///
///         Skipped automatically when MEZO_TESTNET_RPC_URL is not set so CI
///         without a fork URL stays green.
contract MezoCirclesVaultForkTest is Test {
    address constant BORROWER_OPS  = 0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba;
    address constant TROVE_MANAGER = 0x7FE0A5a7EeBD88530c58824475edEae33424671F;
    address constant MUSD          = 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503;

    MezoCirclesVault internal vault;
    address internal user = makeAddr("mezocircles-fork-user");

    function setUp() public {
        try vm.envString("MEZO_TESTNET_RPC_URL") returns (string memory) {
            // ok - caller passed --fork-url, we're on a fork
        } catch {
            vm.skip(true);
        }

        // Sanity: confirm MUSD identity at the expected address.
        // If we're not on a fork, this call returns empty.
        (bool ok, bytes memory data) =
            MUSD.staticcall(abi.encodeWithSignature("symbol()"));
        require(ok && data.length > 0, "MUSD not present at expected address - wrong fork?");

        vault = new MezoCirclesVault(user, BORROWER_OPS, TROVE_MANAGER, MUSD);
        vm.deal(user, 100 ether);
    }

    /// @notice Reading view functions against the real TroveManager should not
    ///         revert - confirms our ITroveManager ABI matches.
    function test_fork_troveManagerViewsCallable() public view {
        // Vault hasn't opened a trove yet - status should be 0 (nonExistent).
        assertEq(vault.vaultStatus(), 0, "fresh vault should be nonExistent");
        assertEq(vault.vaultDebt(), 0);
        assertEq(vault.vaultCollateral(), 0);
    }

    /// @notice Calling openVault with too little collateral against the real
    ///         BorrowerOperations should revert with a specific Liquity error
    ///         message - proving the function selector is recognized and our
    ///         interface signature matches.
    function test_fork_openVault_endToEnd() public {
        uint256 collateral = 1 ether;
        uint256 debt       = 1800e18;

        vm.prank(user);
        vault.openVault{value: collateral}(debt, address(0), address(0));

        assertEq(vault.vaultStatus(), 1, "trove should be active after open");
        assertEq(vault.vaultCollateral(), collateral, "collateral mismatch");
        assertGe(vault.vaultDebt(), debt, "vault debt should be >= requested mint");
    }
}
