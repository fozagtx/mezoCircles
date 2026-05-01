// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title AchievementBadge
/// @notice Soulbound (non-transferable) ERC-721 badges. Each user can earn each badge type once.
contract AchievementBadge is ERC721 {
    using Strings for uint256;

    enum BadgeType {
        FirstDeposit,       // 0
        Streak7,            // 1
        Streak30,           // 2
        CircleCompleted,    // 3
        FiveCircles,        // 4
        TenCircles          // 5
    }
    uint256 public constant BADGE_TYPE_COUNT = 6;

    address public owner;
    address public factory;
    mapping(address => bool) public isCircle;
    mapping(address => mapping(uint256 => bool)) public hasBadge;
    mapping(address => uint32) public circleCompletions;
    string public baseURI;
    uint256 public nextTokenId = 1;

    event BadgeAwarded(address indexed user, BadgeType indexed badge, uint256 tokenId);

    error NotOwner();
    error NotFactoryOrCircle();
    error Soulbound();

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAuthorized() {
        if (msg.sender != factory && !isCircle[msg.sender]) revert NotFactoryOrCircle();
        _;
    }

    constructor(string memory _baseURI) ERC721("mezoCircles Achievement", "MZAB") {
        owner = msg.sender;
        baseURI = _baseURI;
    }

    function setFactory(address _factory) external onlyOwner { factory = _factory; }
    function setCircleAuthorized(address circle, bool ok) external {
        if (msg.sender != owner && msg.sender != factory) revert NotOwner();
        isCircle[circle] = ok;
    }
    function setBaseURI(string calldata u) external onlyOwner { baseURI = u; }
    function transferOwnership(address newOwner) external onlyOwner { owner = newOwner; }

    // ---------- Award hooks ----------

    function maybeAwardFirstDeposit(address user) external onlyAuthorized {
        _award(user, BadgeType.FirstDeposit);
    }

    function maybeAwardStreak(address user, uint256 streak) external onlyAuthorized {
        if (streak >= 30) _award(user, BadgeType.Streak30);
        else if (streak >= 7) _award(user, BadgeType.Streak7);
    }

    function maybeAwardCircleCompleted(address user) external onlyAuthorized {
        _award(user, BadgeType.CircleCompleted);
        circleCompletions[user] += 1;
        if (circleCompletions[user] >= 10) _award(user, BadgeType.TenCircles);
        else if (circleCompletions[user] >= 5) _award(user, BadgeType.FiveCircles);
    }

    // ---------- Internals ----------

    function _award(address user, BadgeType b) internal {
        uint256 idx = uint256(b);
        if (hasBadge[user][idx]) return;
        hasBadge[user][idx] = true;
        uint256 tokenId = nextTokenId++;
        _safeMint(user, tokenId);
        // Encode badge type into upper bits of tokenId mapping (cheap lookup):
        _badgeOfToken[tokenId] = b;
        emit BadgeAwarded(user, b, tokenId);
    }

    mapping(uint256 => BadgeType) internal _badgeOfToken;

    function badgeOf(uint256 tokenId) external view returns (BadgeType) {
        _requireOwned(tokenId);
        return _badgeOfToken[tokenId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(baseURI, uint256(_badgeOfToken[tokenId]).toString(), ".json");
    }

    /// @notice Soulbound: block all transfers except mint and burn.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
