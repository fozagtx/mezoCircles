// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ITroveManager} from "../../src/interfaces/ITroveManager.sol";

/// @notice Test double for Mezo TroveManager. Stores per-borrower debt/coll/status.
contract MockTroveManager is ITroveManager {
    struct Trove {
        uint256 debt;
        uint256 coll;
        uint256 status;
    }

    mapping(address => Trove) public troves;

    function setTrove(address who, uint256 debt, uint256 coll, uint256 status) external {
        troves[who] = Trove({debt: debt, coll: coll, status: status});
    }

    function addColl(address who, uint256 amount) external {
        troves[who].coll += amount;
    }

    function removeColl(address who, uint256 amount) external {
        troves[who].coll -= amount;
    }

    function addDebt(address who, uint256 amount) external {
        troves[who].debt += amount;
    }

    function removeDebt(address who, uint256 amount) external {
        troves[who].debt -= amount;
    }

    function snapshot(address who) external view returns (uint256 debt, uint256 coll) {
        debt = troves[who].debt;
        coll = troves[who].coll;
    }

    function clearTrove(address who) external {
        troves[who] = Trove({debt: 0, coll: 0, status: 2}); // closedByOwner
    }

    function getTroveStatus(address _borrower) external view override returns (uint256) {
        return troves[_borrower].status;
    }

    function getTroveDebt(address _borrower) external view override returns (uint256) {
        return troves[_borrower].debt;
    }

    function getTroveColl(address _borrower) external view override returns (uint256) {
        return troves[_borrower].coll;
    }

    function getCurrentICR(
        address _borrower,
        uint256 _price
    ) external view override returns (uint256) {
        Trove memory t = troves[_borrower];
        if (t.debt == 0) return type(uint256).max;
        return (t.coll * _price) / t.debt;
    }

    function getEntireDebtAndColl(
        address _borrower
    )
        external
        view
        override
        returns (uint256 debt, uint256 coll, uint256, uint256)
    {
        debt = troves[_borrower].debt;
        coll = troves[_borrower].coll;
    }
}
