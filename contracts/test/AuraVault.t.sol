// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AuraVault} from "../src/AuraVault.sol";
import {MockMUSD} from "./mocks/MockMUSD.sol";
import {MockTroveManager} from "./mocks/MockTroveManager.sol";
import {MockBorrowerOperations} from "./mocks/MockBorrowerOperations.sol";

contract AuraVaultTest is Test {
    AuraVault internal vault;
    MockMUSD internal musd;
    MockTroveManager internal troveManager;
    MockBorrowerOperations internal borrowerOps;

    address internal user = address(0xBEEF);

    uint256 internal constant BTC_DEPOSIT = 1 ether;
    uint256 internal constant MUSD_BORROW = 2_000e18;

    function setUp() public {
        musd = new MockMUSD();
        troveManager = new MockTroveManager();
        borrowerOps = new MockBorrowerOperations(musd, troveManager);

        vault = new AuraVault(user, address(borrowerOps), address(troveManager), address(musd));
        vm.deal(user, 100 ether);
    }

    function test_openVault_mintsAndForwardsMUSD() public {
        vm.prank(user);
        vault.openVault{value: BTC_DEPOSIT}(MUSD_BORROW, address(0), address(0));

        assertEq(musd.balanceOf(user), MUSD_BORROW, "user did not receive minted MUSD");
        assertEq(vault.vaultDebt(), MUSD_BORROW, "vault debt mismatch");
        assertEq(vault.vaultCollateral(), BTC_DEPOSIT, "vault collateral mismatch");
        assertEq(vault.vaultStatus(), 1, "vault should be active");
    }

    function test_openVault_revertsForNonOwner() public {
        address stranger = address(0xCAFE);
        vm.deal(stranger, BTC_DEPOSIT);
        vm.prank(stranger);
        vm.expectRevert(AuraVault.NotOwner.selector);
        vault.openVault{value: BTC_DEPOSIT}(MUSD_BORROW, address(0), address(0));
    }

    function test_openVault_revertsOnZeroBTC() public {
        vm.prank(user);
        vm.expectRevert(AuraVault.ZeroAmount.selector);
        vault.openVault(MUSD_BORROW, address(0), address(0));
    }

    function test_addCollateral_increasesBalance() public {
        _openDefaultVault();

        vm.prank(user);
        vault.addCollateral{value: 0.5 ether}(address(0), address(0));

        assertEq(vault.vaultCollateral(), BTC_DEPOSIT + 0.5 ether);
    }

    function test_repayDebt_decreasesDebt() public {
        _openDefaultVault();

        uint256 repay = 500e18;
        vm.startPrank(user);
        musd.approve(address(vault), repay);
        vault.repayDebt(repay, address(0), address(0));
        vm.stopPrank();

        assertEq(vault.vaultDebt(), MUSD_BORROW - repay);
        assertEq(musd.balanceOf(user), MUSD_BORROW - repay);
    }

    function test_closeVault_returnsCollateralAndClears() public {
        _openDefaultVault();
        uint256 ownerBalanceBefore = user.balance;

        vm.startPrank(user);
        musd.approve(address(vault), MUSD_BORROW);
        vault.closeVault();
        vm.stopPrank();

        assertEq(vault.vaultDebt(), 0);
        assertEq(vault.vaultCollateral(), 0);
        assertEq(vault.vaultStatus(), 2, "should be closedByOwner");
        assertEq(user.balance, ownerBalanceBefore + BTC_DEPOSIT, "BTC not returned");
    }

    function test_vaultICR_handlesNoDebt() public {
        assertEq(vault.vaultICR(50_000e18), type(uint256).max);
    }

    function _openDefaultVault() internal {
        vm.prank(user);
        vault.openVault{value: BTC_DEPOSIT}(MUSD_BORROW, address(0), address(0));
    }
}
