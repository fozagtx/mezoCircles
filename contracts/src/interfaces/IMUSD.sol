// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-20 surface for MUSD on Mezo.
/// @dev MUSD testnet: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
///      MUSD mainnet: 0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186
interface IMUSD {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function totalSupply() external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}
