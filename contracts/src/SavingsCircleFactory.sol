// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {SavingsCircle} from "./SavingsCircle.sol";

interface IAuthorizable {
    function setCircleAuthorized(address circle, bool ok) external;
}

/// @title SavingsCircleFactory
/// @notice Deploys SavingsCircle clones (EIP-1167) and indexes them for discovery.
contract SavingsCircleFactory {
    address public immutable implementation;
    address public reputationSystem;
    address public achievementBadge;
    address public owner;

    address[] public allCircles;
    mapping(address => address[]) public circlesByCreator;
    mapping(address => address[]) public circlesByMember;
    mapping(address => bool) public isCircle;

    event CircleCreated(
        uint256 indexed circleId,
        address indexed circle,
        address indexed creator,
        string name,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint8 maxMembers,
        address token,
        address yieldVault
    );

    event MembershipIndexed(address indexed circle, address indexed member);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier onlyCircle() { require(isCircle[msg.sender], "not circle"); _; }

    constructor(address _implementation, address _reputationSystem, address _achievementBadge) {
        implementation = _implementation;
        reputationSystem = _reputationSystem;
        achievementBadge = _achievementBadge;
        owner = msg.sender;
    }

    function setSystems(address _rep, address _badge) external onlyOwner {
        reputationSystem = _rep;
        achievementBadge = _badge;
    }

    function transferOwnership(address newOwner) external onlyOwner { owner = newOwner; }

    function createCircle(
        string calldata name,
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint8 maxMembers,
        address token,
        address yieldVault
    ) external returns (address circle) {
        uint256 id = allCircles.length;
        circle = Clones.clone(implementation);

        SavingsCircle(circle).initialize(
            id,
            msg.sender,
            name,
            contributionAmount,
            cycleDuration,
            maxMembers,
            reputationSystem,
            achievementBadge,
            token,
            yieldVault
        );

        allCircles.push(circle);
        isCircle[circle] = true;
        circlesByCreator[msg.sender].push(circle);
        circlesByMember[msg.sender].push(circle);

        // Authorize the new circle to write to the reputation + badge contracts.
        if (reputationSystem != address(0)) {
            IAuthorizable(reputationSystem).setCircleAuthorized(circle, true);
        }
        if (achievementBadge != address(0)) {
            IAuthorizable(achievementBadge).setCircleAuthorized(circle, true);
        }

        emit CircleCreated(id, circle, msg.sender, name, contributionAmount, cycleDuration, maxMembers, token, yieldVault);
        emit MembershipIndexed(circle, msg.sender);
    }

    /// @notice Called by a SavingsCircle when a new member joins so the factory can index them.
    /// @dev Members call `circle.join()`, the circle then calls back here.
    function indexMembership(address member) external onlyCircle {
        circlesByMember[member].push(msg.sender);
        emit MembershipIndexed(msg.sender, member);
    }

    function allCirclesLength() external view returns (uint256) { return allCircles.length; }
    function getCirclesByCreator(address who) external view returns (address[] memory) { return circlesByCreator[who]; }
    function getCirclesByMember(address who) external view returns (address[] memory) { return circlesByMember[who]; }

    /// @notice Page through all circles for a discovery feed.
    function page(uint256 offset, uint256 limit) external view returns (address[] memory out) {
        uint256 n = allCircles.length;
        if (offset >= n) return new address[](0);
        uint256 end = offset + limit;
        if (end > n) end = n;
        out = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) out[i - offset] = allCircles[i];
    }
}
