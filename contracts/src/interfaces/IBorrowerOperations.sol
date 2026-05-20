// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Subset of Mezo's BorrowerOperations (simplified Liquity fork) used by MezoCirclesVault.
/// @dev    Signatures verified by direct cast probes against deployed BorrowerOperations
///         at 0xa14cbA6DD12D537A8decc7dd3c4aC413B8711eba on Mezo testnet (chainId 31611).
///         Source: github.com/mezo-org/musd/blob/main/solidity/contracts/BorrowerOperations.sol
///
///         Notes:
///         - Mezo's fork does NOT use the Liquity-v2 per-trove interest-rate or
///           maxFee parameters. There is no _maxFeePercentage / _interestRate
///           argument anywhere. Rates are governed by a separate InterestRateManager.
///         - openTrove + addColl take BTC collateral via msg.value (Mezo gas is BTC).
interface IBorrowerOperations {
    function openTrove(
        uint256 _debtAmount,
        address _upperHint,
        address _lowerHint
    ) external payable;

    function addColl(address _upperHint, address _lowerHint) external payable;

    function withdrawColl(
        uint256 _amount,
        address _upperHint,
        address _lowerHint
    ) external;

    function withdrawMUSD(
        uint256 _amount,
        address _upperHint,
        address _lowerHint
    ) external;

    function repayMUSD(
        uint256 _amount,
        address _upperHint,
        address _lowerHint
    ) external;

    function closeTrove() external;

    function adjustTrove(
        uint256 _collWithdrawal,
        uint256 _debtChange,
        bool _isDebtIncrease,
        address _upperHint,
        address _lowerHint
    ) external payable;
}
