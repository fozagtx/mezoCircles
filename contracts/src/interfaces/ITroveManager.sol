// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subset of Mezo's TroveManager (Liquity-v2 fork) used by MezoCirclesVault.
/// @dev Source: github.com/mezo-org/musd. Status enum + getters mirror Liquity.
interface ITroveManager {
    enum Status {
        nonExistent,
        active,
        closedByOwner,
        closedByLiquidation,
        closedByRedemption
    }

    function getTroveStatus(address _borrower) external view returns (uint256);

    function getTroveDebt(address _borrower) external view returns (uint256);

    function getTroveColl(address _borrower) external view returns (uint256);

    function getCurrentICR(
        address _borrower,
        uint256 _price
    ) external view returns (uint256);

    function getEntireDebtAndColl(
        address _borrower
    )
        external
        view
        returns (
            uint256 debt,
            uint256 coll,
            uint256 pendingMUSDDebtReward,
            uint256 pendingCollateralReward
        );
}
