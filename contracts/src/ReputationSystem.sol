// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title ReputationSystem
/// @notice Tracks XP, rank, and circle stats for users. SavingsCircle clones write to it via the
///         factory's authorization list. Users can also claim daily quests and register referrals.
contract ReputationSystem {
    enum Rank { Bronze, Silver, Gold, Platinum, Diamond }

    struct Profile {
        uint64 xp;
        uint32 deposits;
        uint32 missed;
        uint32 circlesCompleted;
        uint32 currentStreak;     // daily-quest streak, in days
        uint64 lastQuestTimestamp;
        address referrer;
        bool hasReferrer;
    }

    int256 public constant XP_DEPOSIT       = 10;
    int256 public constant XP_MISSED        = -25;
    int256 public constant XP_CIRCLE_DONE   = 100;
    int256 public constant XP_DAILY_QUEST   = 5;
    int256 public constant XP_REFERRAL      = 50;
    uint256 public constant DAY = 1 days;

    address public owner;
    address public factory;
    mapping(address => bool) public isCircle; // mirrored from factory for write-auth
    mapping(address => Profile) public profiles;

    event XpChanged(address indexed user, int256 delta, uint64 newXp);
    event RankChanged(address indexed user, Rank newRank);
    event ReferralRegistered(address indexed referrer, address indexed referee);
    event QuestClaimed(address indexed user, uint32 newStreak, uint64 timestamp);

    error NotOwner();
    error NotFactoryOrCircle();
    error AlreadyHasReferrer();
    error SelfReferral();
    error QuestAlreadyClaimedToday();

    modifier onlyOwner() { if (msg.sender != owner) revert NotOwner(); _; }
    modifier onlyAuthorized() {
        if (msg.sender != factory && !isCircle[msg.sender]) revert NotFactoryOrCircle();
        _;
    }

    constructor() { owner = msg.sender; }

    function setFactory(address _factory) external onlyOwner { factory = _factory; }
    function setCircleAuthorized(address circle, bool ok) external {
        if (msg.sender != owner && msg.sender != factory) revert NotOwner();
        isCircle[circle] = ok;
    }
    function transferOwnership(address newOwner) external onlyOwner { owner = newOwner; }

    // ---------- Hooks called by SavingsCircle ----------

    function recordDeposit(address user, uint256 /*circleId*/) external onlyAuthorized {
        Profile storage p = profiles[user];
        p.deposits += 1;
        _applyXp(user, XP_DEPOSIT);
    }

    function recordMissedPayment(address user, uint256 /*circleId*/) external onlyAuthorized {
        Profile storage p = profiles[user];
        p.missed += 1;
        _applyXp(user, XP_MISSED);
    }

    function recordCircleCompleted(address user, uint256 /*circleId*/) external onlyAuthorized {
        Profile storage p = profiles[user];
        p.circlesCompleted += 1;
        _applyXp(user, XP_CIRCLE_DONE);
    }

    // ---------- User-facing ----------

    function claimDailyQuest() external {
        Profile storage p = profiles[msg.sender];
        uint64 nowTs = uint64(block.timestamp);
        uint64 last = p.lastQuestTimestamp;
        uint64 todayBucket = nowTs / uint64(DAY);
        uint64 lastBucket = last / uint64(DAY);
        if (last != 0 && lastBucket == todayBucket) revert QuestAlreadyClaimedToday();

        if (last != 0 && todayBucket == lastBucket + 1) {
            p.currentStreak += 1;
        } else {
            p.currentStreak = 1;
        }
        p.lastQuestTimestamp = nowTs;
        _applyXp(msg.sender, XP_DAILY_QUEST);
        emit QuestClaimed(msg.sender, p.currentStreak, nowTs);
    }

    function registerReferral(address referrer) external {
        if (referrer == msg.sender) revert SelfReferral();
        Profile storage me = profiles[msg.sender];
        if (me.hasReferrer) revert AlreadyHasReferrer();
        me.hasReferrer = true;
        me.referrer = referrer;
        _applyXp(msg.sender, XP_REFERRAL);
        _applyXp(referrer, XP_REFERRAL);
        emit ReferralRegistered(referrer, msg.sender);
    }

    // ---------- Views ----------

    function rankOf(address user) public view returns (Rank) {
        uint64 xp = profiles[user].xp;
        if (xp >= 5000) return Rank.Diamond;
        if (xp >= 2000) return Rank.Platinum;
        if (xp >= 750)  return Rank.Gold;
        if (xp >= 200)  return Rank.Silver;
        return Rank.Bronze;
    }

    function summary(address user) external view returns (
        uint64 xp,
        Rank rank,
        uint32 deposits,
        uint32 missed,
        uint32 circlesCompleted,
        uint32 currentStreak,
        bool questClaimableToday
    ) {
        Profile memory p = profiles[user];
        xp = p.xp;
        rank = rankOf(user);
        deposits = p.deposits;
        missed = p.missed;
        circlesCompleted = p.circlesCompleted;
        currentStreak = p.currentStreak;
        uint64 todayBucket = uint64(block.timestamp) / uint64(DAY);
        uint64 lastBucket = p.lastQuestTimestamp / uint64(DAY);
        questClaimableToday = (p.lastQuestTimestamp == 0) || (lastBucket < todayBucket);
    }

    // ---------- Internals ----------

    function _applyXp(address user, int256 delta) internal {
        Profile storage p = profiles[user];
        Rank before = rankOf(user);
        if (delta >= 0) {
            p.xp += uint64(uint256(delta));
        } else {
            uint64 sub = uint64(uint256(-delta));
            p.xp = sub > p.xp ? 0 : p.xp - sub;
        }
        emit XpChanged(user, delta, p.xp);
        Rank now_ = rankOf(user);
        if (now_ != before) emit RankChanged(user, now_);
    }
}
