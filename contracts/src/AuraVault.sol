// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IBorrowerOperations} from "./interfaces/IBorrowerOperations.sol";
import {ITroveManager} from "./interfaces/ITroveManager.sol";
import {IMUSD} from "./interfaces/IMUSD.sol";

/// @title AuraVault
/// @notice Per-user vault that owns a single Mezo MUSD Trove on the user's behalf.
///         Wraps BorrowerOperations so the owner gets simple deposit / borrow /
///         repay / close calls without juggling hints manually.
/// @dev    One AuraVault instance == one Mezo Trove. Each user deploys (or has
///         a factory deploy) their own vault. The vault address is the Trove
///         owner from BorrowerOperations' perspective.
///
///         Mezo's MUSD is a simplified Liquity fork — there is NO per-trove
///         maxFee or interestRate parameter; rates are governed protocol-wide
///         by InterestRateManager. See docs/research/mezo-validation.md.
contract AuraVault {
    address public immutable owner;
    IBorrowerOperations public immutable borrowerOps;
    ITroveManager public immutable troveManager;
    IMUSD public immutable musd;

    error NotOwner();
    error ZeroAmount();
    error TransferFailed();
    error BTCRefundFailed();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _owner,
        address _borrowerOps,
        address _troveManager,
        address _musd
    ) {
        owner = _owner;
        borrowerOps = IBorrowerOperations(_borrowerOps);
        troveManager = ITroveManager(_troveManager);
        musd = IMUSD(_musd);
    }

    /// @notice Accept BTC (native gas) deposits — used when topping up collateral.
    receive() external payable {}

    // ============================================================
    // Mutations
    // ============================================================

    /// @notice Open the Trove. Caller sends BTC as msg.value, vault opens a
    ///         Trove on Mezo, mints `debtAmount` MUSD, forwards it to owner.
    function openVault(
        uint256 debtAmount,
        address upperHint,
        address lowerHint
    ) external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();

        borrowerOps.openTrove{value: msg.value}(debtAmount, upperHint, lowerHint);

        uint256 minted = musd.balanceOf(address(this));
        if (minted > 0) {
            if (!musd.transfer(owner, minted)) revert TransferFailed();
        }
    }

    /// @notice Top up collateral by sending BTC.
    function addCollateral(
        address upperHint,
        address lowerHint
    ) external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        borrowerOps.addColl{value: msg.value}(upperHint, lowerHint);
    }

    /// @notice Repay MUSD debt. Owner must approve this vault for `amount` MUSD first.
    function repayDebt(
        uint256 amount,
        address upperHint,
        address lowerHint
    ) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        if (!musd.transferFrom(owner, address(this), amount)) {
            revert TransferFailed();
        }
        if (!musd.approve(address(borrowerOps), amount)) {
            revert TransferFailed();
        }
        borrowerOps.repayMUSD(amount, upperHint, lowerHint);
    }

    /// @notice Close the Trove. Owner must first approve this vault to pull
    ///         the outstanding MUSD debt. Released BTC collateral is forwarded
    ///         back to owner.
    function closeVault() external onlyOwner {
        uint256 debt = troveManager.getTroveDebt(address(this));
        if (debt > 0) {
            if (!musd.transferFrom(owner, address(this), debt)) {
                revert TransferFailed();
            }
            if (!musd.approve(address(borrowerOps), debt)) {
                revert TransferFailed();
            }
        }

        borrowerOps.closeTrove();

        uint256 btcBalance = address(this).balance;
        if (btcBalance > 0) {
            (bool ok, ) = owner.call{value: btcBalance}("");
            if (!ok) revert BTCRefundFailed();
        }
    }

    // ============================================================
    // Views
    // ============================================================

    function vaultStatus() external view returns (uint256) {
        return troveManager.getTroveStatus(address(this));
    }

    function vaultDebt() external view returns (uint256) {
        return troveManager.getTroveDebt(address(this));
    }

    function vaultCollateral() external view returns (uint256) {
        return troveManager.getTroveColl(address(this));
    }

    function vaultICR(uint256 price) external view returns (uint256) {
        return troveManager.getCurrentICR(address(this), price);
    }

    function vaultPosition()
        external
        view
        returns (uint256 debt, uint256 collateral, uint256 status)
    {
        debt = troveManager.getTroveDebt(address(this));
        collateral = troveManager.getTroveColl(address(this));
        status = troveManager.getTroveStatus(address(this));
    }
}
