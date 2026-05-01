// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IReputationSystem {
    function recordDeposit(address user, uint256 circleId) external;
    function recordMissedPayment(address user, uint256 circleId) external;
    function recordCircleCompleted(address user, uint256 circleId) external;
}

interface IAchievementBadge {
    function maybeAwardFirstDeposit(address user) external;
    function maybeAwardCircleCompleted(address user) external;
    function maybeAwardStreak(address user, uint256 streak) external;
}

interface ISavingsCircleFactory {
    function indexMembership(address member) external;
}

/// @notice Minimal ERC-4626 surface used for the optional idle-pot yield hook.
interface IERC4626 {
    function asset() external view returns (address);
    function deposit(uint256 assets, address receiver) external returns (uint256 shares);
    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);
    function balanceOf(address account) external view returns (uint256);
    function convertToAssets(uint256 shares) external view returns (uint256);
}

/// @title SavingsCircle — one ROSCA circle, deployed as an EIP-1167 clone by the factory.
/// @notice Members deposit a fixed amount each cycle; one member receives the full pot per cycle
///         in rotation. Payouts use a pull-pattern so a single non-receivable member cannot brick
///         the circle. If a circle stalls, the creator can `abort()` after a grace period and
///         members can `claimRefund()` their unclaimed contributions.
contract SavingsCircle is Initializable {
    using SafeERC20 for IERC20;

    // Inline reentrancy guard (clone-safe — no constructor needed; default 0 means unlocked).
    uint256 private _reentrancy;
    modifier nonReentrant() {
        require(_reentrancy != 1, "reentrant");
        _reentrancy = 1;
        _;
        _reentrancy = 0;
    }

    // ---------- Errors ----------
    error NotCreator();
    error NotMember();
    error AlreadyMember();
    error CircleFull();
    error CircleNotPending();
    error CircleNotActive();
    error CircleNotAbortable();
    error WrongDepositAmount();
    error AlreadyDepositedThisCycle();
    error CycleNotFinished();
    error PayoutAlreadyClaimed();
    error TransferFailed();
    error TooFewMembers();
    error UnexpectedNativeValue();
    error YieldRequiresToken();
    error VaultAssetMismatch();
    error NothingToClaim();

    // ---------- Events ----------
    event MemberJoined(address indexed member, uint256 memberIndex);
    event CircleStarted(uint256 startTime, address[] payoutOrder);
    event Deposited(address indexed member, uint256 indexed cycle, uint256 amount);
    event PayoutAccrued(address indexed recipient, uint256 indexed cycle, uint256 amount);
    event PayoutClaimed(address indexed recipient, uint256 amount);
    event MemberDefaulted(address indexed member, uint256 indexed cycle);
    event CircleCompleted();
    event CircleAborted(uint256 atCycle);
    event RefundClaimed(address indexed member, uint256 amount);

    /// @notice After a cycle deadline, anyone can `abort()` once this much extra time has passed
    ///         without `settleCycle()` succeeding. Gives a stalled circle an escape hatch.
    uint256 public constant ABORT_GRACE = 7 days;

    // ---------- Configuration (set on init, immutable thereafter) ----------
    uint256 public circleId;
    address public creator;
    address public factory;
    string public name;
    uint256 public contributionAmount;       // base units of `token` (or wei BTC if token == 0) per member per cycle
    uint256 public cycleDuration;             // seconds
    uint8 public maxMembers;                  // 3..10
    address public reputationSystem;
    address public achievementBadge;

    /// @notice ERC-20 contribution token (e.g. mUSD on Mezo). Zero address => native BTC.
    address public token;
    /// @notice Optional ERC-4626 vault for idle-pot yield. Zero => no yield. Requires `token != 0`.
    address public yieldVault;

    // ---------- State ----------
    enum Status { Pending, Active, Completed, Aborted }
    Status public status;

    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => uint8) public memberIndex;       // 1-based; 0 means not a member

    address[] public payoutOrder;                       // permutation of members
    uint256 public startTime;
    uint256 public currentCycle;                        // 0-indexed

    // cycle => member => deposited?
    mapping(uint256 => mapping(address => bool)) public hasDeposited;
    // cycle => count of deposits received
    mapping(uint256 => uint8) public depositsThisCycle;
    // cycle => already paid out?
    mapping(uint256 => bool) public payoutClaimed;

    // streaks for badge awarding (consecutive on-time deposits per member)
    mapping(address => uint256) public depositStreak;

    // Pull-pattern accounting. settleCycle accrues to pendingPayout; recipient pulls via claimPayout.
    mapping(address => uint256) public pendingPayout;
    uint256 public totalPending;

    // Set on abort(). Members claim their refund via claimRefund().
    mapping(address => uint256) public refundOwed;

    function initialize(
        uint256 _circleId,
        address _creator,
        string calldata _name,
        uint256 _contributionAmount,
        uint256 _cycleDuration,
        uint8 _maxMembers,
        address _reputationSystem,
        address _achievementBadge,
        address _token,
        address _yieldVault
    ) external initializer {
        require(_maxMembers >= 3 && _maxMembers <= 10, "members 3..10");
        require(_contributionAmount > 0, "amount=0");
        require(_cycleDuration >= 1 hours, "cycle too short");

        if (_yieldVault != address(0)) {
            if (_token == address(0)) revert YieldRequiresToken();
            if (IERC4626(_yieldVault).asset() != _token) revert VaultAssetMismatch();
        }

        circleId = _circleId;
        creator = _creator;
        factory = msg.sender;
        name = _name;
        contributionAmount = _contributionAmount;
        cycleDuration = _cycleDuration;
        maxMembers = _maxMembers;
        reputationSystem = _reputationSystem;
        achievementBadge = _achievementBadge;
        token = _token;
        yieldVault = _yieldVault;
        status = Status.Pending;

        _addMember(_creator);
    }

    // ---------- Joining ----------

    function join() external {
        if (status != Status.Pending) revert CircleNotPending();
        if (members.length >= maxMembers) revert CircleFull();
        if (isMember[msg.sender]) revert AlreadyMember();
        _addMember(msg.sender);

        // Factory is a known, trusted contract — surface failures rather than swallow them.
        if (factory != address(0)) {
            ISavingsCircleFactory(factory).indexMembership(msg.sender);
        }

        // Auto-start once full.
        if (members.length == maxMembers) {
            _start();
        }
    }

    /// @notice Allow the creator to start early once at least 3 members have joined.
    function startEarly() external {
        if (msg.sender != creator) revert NotCreator();
        if (status != Status.Pending) revert CircleNotPending();
        if (members.length < 3) revert TooFewMembers();
        _start();
    }

    function _addMember(address who) internal {
        members.push(who);
        isMember[who] = true;
        memberIndex[who] = uint8(members.length); // 1-based
        emit MemberJoined(who, members.length);
    }

    function _start() internal {
        status = Status.Active;
        startTime = block.timestamp;
        payoutOrder = _shuffleMembers();
        emit CircleStarted(startTime, payoutOrder);
    }

    /// @dev Fisher–Yates using a single seed. Good enough for hackathon use; for production
    ///      use commit-reveal or a VRF — `prevrandao` is validator-influenceable.
    function _shuffleMembers() internal view returns (address[] memory order) {
        uint256 n = members.length;
        order = new address[](n);
        for (uint256 i = 0; i < n; i++) order[i] = members[i];

        uint256 seed = uint256(
            keccak256(abi.encodePacked(block.prevrandao, block.timestamp, circleId, address(this)))
        );
        for (uint256 i = n - 1; i > 0; i--) {
            uint256 j = seed % (i + 1);
            (order[i], order[j]) = (order[j], order[i]);
            seed = uint256(keccak256(abi.encodePacked(seed)));
        }
    }

    // ---------- Deposits ----------

    function deposit() external payable nonReentrant {
        if (status != Status.Active) revert CircleNotActive();
        if (!isMember[msg.sender]) revert NotMember();

        uint256 cycle = currentCycle;
        if (hasDeposited[cycle][msg.sender]) revert AlreadyDepositedThisCycle();

        if (token == address(0)) {
            if (msg.value != contributionAmount) revert WrongDepositAmount();
        } else {
            if (msg.value != 0) revert UnexpectedNativeValue();
            // Balance-diff guard against fee-on-transfer / rebasing tokens — pot accounting
            // assumes exactly `contributionAmount` is credited.
            uint256 before = IERC20(token).balanceOf(address(this));
            IERC20(token).safeTransferFrom(msg.sender, address(this), contributionAmount);
            uint256 received = IERC20(token).balanceOf(address(this)) - before;
            if (received != contributionAmount) revert WrongDepositAmount();
            if (yieldVault != address(0)) {
                IERC20(token).forceApprove(yieldVault, contributionAmount);
                IERC4626(yieldVault).deposit(contributionAmount, address(this));
            }
        }

        hasDeposited[cycle][msg.sender] = true;
        depositsThisCycle[cycle] += 1;

        // Reputation + badges (best-effort; revert on these would lock the circle, so swallow).
        if (reputationSystem != address(0)) {
            try IReputationSystem(reputationSystem).recordDeposit(msg.sender, circleId) {} catch {}
        }
        depositStreak[msg.sender] += 1;
        if (achievementBadge != address(0)) {
            try IAchievementBadge(achievementBadge).maybeAwardFirstDeposit(msg.sender) {} catch {}
            try IAchievementBadge(achievementBadge).maybeAwardStreak(msg.sender, depositStreak[msg.sender]) {} catch {}
        }

        emit Deposited(msg.sender, cycle, contributionAmount);
    }

    // ---------- Settlement (push-to-pending; recipient pulls separately) ----------

    /// @notice Anyone can poke the contract once a cycle window has elapsed. The recipient's pot
    ///         is moved to `pendingPayout[recipient]`, defaulters are flagged, the cycle advances.
    ///         The recipient claims their share via `claimPayout()`.
    function settleCycle() external nonReentrant {
        if (status != Status.Active) revert CircleNotActive();
        uint256 cycle = currentCycle;
        if (block.timestamp < startTime + (cycle + 1) * cycleDuration) revert CycleNotFinished();
        if (payoutClaimed[cycle]) revert PayoutAlreadyClaimed();

        address recipient = payoutOrder[cycle];

        // Redeem any vault shares back to the contract before computing the pot, so the
        // recipient gets their share of accrued yield along with the principal.
        _redeemAllVault();

        // Pot for this cycle = current loose balance minus everything previously accrued.
        uint256 liveLoose = (token == address(0))
            ? address(this).balance
            : IERC20(token).balanceOf(address(this));
        uint256 pot = liveLoose - totalPending;

        // Flag defaulters (didn't deposit this cycle, excluding the recipient who still owes
        // their own contribution but receives the pot regardless — this is standard ROSCA).
        for (uint256 i = 0; i < members.length; i++) {
            address m = members[i];
            if (!hasDeposited[cycle][m]) {
                if (reputationSystem != address(0)) {
                    try IReputationSystem(reputationSystem).recordMissedPayment(m, circleId) {} catch {}
                }
                depositStreak[m] = 0;
                emit MemberDefaulted(m, cycle);
            }
        }

        payoutClaimed[cycle] = true;
        pendingPayout[recipient] += pot;
        totalPending += pot;
        emit PayoutAccrued(recipient, cycle, pot);

        // Advance.
        if (cycle + 1 >= members.length) {
            status = Status.Completed;
            emit CircleCompleted();

            for (uint256 i = 0; i < members.length; i++) {
                address m = members[i];
                if (reputationSystem != address(0)) {
                    try IReputationSystem(reputationSystem).recordCircleCompleted(m, circleId) {} catch {}
                }
                if (achievementBadge != address(0)) {
                    try IAchievementBadge(achievementBadge).maybeAwardCircleCompleted(m) {} catch {}
                }
            }
        } else {
            currentCycle = cycle + 1;
        }
    }

    function claimPayout() external nonReentrant {
        uint256 amt = pendingPayout[msg.sender];
        if (amt == 0) revert NothingToClaim();
        pendingPayout[msg.sender] = 0;
        totalPending -= amt;
        _payOut(msg.sender, amt);
        emit PayoutClaimed(msg.sender, amt);
    }

    // ---------- Abort + refund (escape hatch) ----------

    /// @notice After a cycle is overdue by `ABORT_GRACE`, anyone can abort the circle. Members
    ///         can then `claimRefund()` for principal contributed in unsettled cycles. Yield
    ///         residual stays in the contract (forfeit). Already-accrued payouts remain claimable.
    function abort() external {
        if (status != Status.Active) revert CircleNotAbortable();
        uint256 cycle = currentCycle;
        if (block.timestamp < startTime + (cycle + 1) * cycleDuration + ABORT_GRACE) {
            revert CircleNotAbortable();
        }
        status = Status.Aborted;

        _redeemAllVault();

        uint256 n = members.length;
        for (uint256 i = 0; i < n; i++) {
            address m = members[i];
            uint256 principal = 0;
            for (uint256 c = cycle; c < n; c++) {
                if (hasDeposited[c][m] && !payoutClaimed[c]) principal += contributionAmount;
            }
            if (principal > 0) refundOwed[m] = principal;
        }

        emit CircleAborted(cycle);
    }

    function claimRefund() external nonReentrant {
        uint256 amt = refundOwed[msg.sender];
        if (amt == 0) revert NothingToClaim();
        refundOwed[msg.sender] = 0;
        _payOut(msg.sender, amt);
        emit RefundClaimed(msg.sender, amt);
    }

    // ---------- Internals ----------

    function _redeemAllVault() internal {
        if (yieldVault == address(0)) return;
        uint256 shares = IERC4626(yieldVault).balanceOf(address(this));
        if (shares > 0) IERC4626(yieldVault).redeem(shares, address(this), address(this));
    }

    function _payOut(address to, uint256 amt) internal {
        if (token == address(0)) {
            (bool ok, ) = to.call{value: amt}("");
            if (!ok) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amt);
        }
    }

    // ---------- Views ----------

    function membersList() external view returns (address[] memory) { return members; }
    function payoutOrderList() external view returns (address[] memory) { return payoutOrder; }
    function memberCount() external view returns (uint256) { return members.length; }

    function currentRecipient() external view returns (address) {
        if (status != Status.Active) return address(0);
        return payoutOrder[currentCycle];
    }

    function cycleDeadline(uint256 cycle) external view returns (uint256) {
        if (startTime == 0) return 0;
        return startTime + (cycle + 1) * cycleDuration;
    }

    /// @notice Convenience snapshot for the frontend.
    function summary()
        external
        view
        returns (
            Status _status,
            uint256 _currentCycle,
            uint8 _memberCount,
            uint8 _depositsThisCycle,
            uint256 _potBalance,
            uint256 _nextDeadline,
            address _nextRecipient
        )
    {
        _status = status;
        _currentCycle = currentCycle;
        _memberCount = uint8(members.length);
        _depositsThisCycle = depositsThisCycle[currentCycle];
        _potBalance = _liveAssets();
        _nextDeadline = startTime == 0 ? 0 : startTime + (currentCycle + 1) * cycleDuration;
        _nextRecipient = (status == Status.Active) ? payoutOrder[currentCycle] : address(0);
    }

    /// @notice Total assets currently held — loose balance plus anything staked in the yield vault.
    function _liveAssets() internal view returns (uint256) {
        if (token == address(0)) return address(this).balance;
        uint256 loose = IERC20(token).balanceOf(address(this));
        if (yieldVault == address(0)) return loose;
        uint256 shares = IERC4626(yieldVault).balanceOf(address(this));
        return loose + (shares == 0 ? 0 : IERC4626(yieldVault).convertToAssets(shares));
    }

    function totalAssets() external view returns (uint256) { return _liveAssets(); }
}
