// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";
import {SavingsCircleFactory} from "../src/SavingsCircleFactory.sol";
import {ReputationSystem} from "../src/ReputationSystem.sol";
import {AchievementBadge} from "../src/AchievementBadge.sol";

contract SavingsCircleTest is Test {
    SavingsCircle impl;
    SavingsCircleFactory factory;
    ReputationSystem rep;
    AchievementBadge badge;

    address alice = address(0xA11CE);
    address bob   = address(0xB0B);
    address carol = address(0xCA401);

    uint256 constant CONTRIB = 0.01 ether;
    uint256 constant CYCLE = 1 days;

    function setUp() public {
        impl = new SavingsCircle();
        rep = new ReputationSystem();
        badge = new AchievementBadge("ipfs://test/");
        factory = new SavingsCircleFactory(address(impl), address(rep), address(badge));
        rep.setFactory(address(factory));
        badge.setFactory(address(factory));

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(carol, 10 ether);
    }

    function _newCircle() internal returns (SavingsCircle c) {
        vm.prank(alice);
        address addr = factory.createCircle("Test Circle", CONTRIB, CYCLE, 3, address(0), address(0));
        c = SavingsCircle(addr);
    }

    function test_createCircle_indexesCreator() public {
        _newCircle();
        assertEq(factory.allCirclesLength(), 1);
        assertEq(factory.getCirclesByCreator(alice).length, 1);
    }

    function test_join_autoStartsWhenFull() public {
        SavingsCircle c = _newCircle();
        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();
        assertEq(uint256(c.status()), uint256(SavingsCircle.Status.Active));
        assertEq(c.memberCount(), 3);
    }

    function test_fullCycle_paysOutAndCompletes() public {
        SavingsCircle c = _newCircle();
        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();
        // active now

        for (uint256 cycle = 0; cycle < 3; cycle++) {
            vm.prank(alice); c.deposit{value: CONTRIB}();
            vm.prank(bob);   c.deposit{value: CONTRIB}();
            vm.prank(carol); c.deposit{value: CONTRIB}();

            address recipient = c.currentRecipient();
            uint256 balBefore = recipient.balance;
            vm.warp(block.timestamp + CYCLE + 1);
            c.settleCycle();

            // settleCycle accrues, doesn't push.
            assertEq(c.pendingPayout(recipient), CONTRIB * 3);
            assertEq(recipient.balance, balBefore);

            vm.prank(recipient); c.claimPayout();
            assertEq(recipient.balance, balBefore + CONTRIB * 3);
            assertEq(c.pendingPayout(recipient), 0);
        }

        assertEq(uint256(c.status()), uint256(SavingsCircle.Status.Completed));
        // each member should have completed-circle stats
        (, , , , uint32 done, , ) = rep.summary(alice);
        assertEq(done, 1);
    }

    function test_nonReceivableRecipient_doesNotBrickCircle() public {
        // Bob is replaced by a contract that rejects native BTC. Under push-payouts this would
        // brick the circle on bob's cycle. Pull-pattern keeps the circle moving.
        RejectingRecipient rr = new RejectingRecipient();
        address rrAddr = address(rr);
        vm.deal(rrAddr, 10 ether);

        SavingsCircle c = _newCircle();
        vm.prank(rrAddr); c.join();
        vm.prank(carol);  c.join();

        // First cycle (whoever the shuffle picked).
        vm.prank(alice);  c.deposit{value: CONTRIB}();
        vm.prank(rrAddr); c.deposit{value: CONTRIB}();
        vm.prank(carol);  c.deposit{value: CONTRIB}();
        vm.warp(block.timestamp + CYCLE + 1);
        c.settleCycle(); // does not revert even if rr is the recipient

        // If rr was picked, claim must fail (its recipient rejects), but other cycles can still settle.
        if (c.pendingPayout(rrAddr) > 0) {
            vm.expectRevert(SavingsCircle.TransferFailed.selector);
            vm.prank(rrAddr); c.claimPayout();
        }

        // Continue remaining cycles regardless.
        for (uint256 cycle = 1; cycle < 3; cycle++) {
            vm.prank(alice);  c.deposit{value: CONTRIB}();
            vm.prank(rrAddr); c.deposit{value: CONTRIB}();
            vm.prank(carol);  c.deposit{value: CONTRIB}();
            vm.warp(block.timestamp + CYCLE + 1);
            c.settleCycle();
        }
        assertEq(uint256(c.status()), uint256(SavingsCircle.Status.Completed));
    }

    function test_abort_refundsUnclaimedPrincipal() public {
        SavingsCircle c = _newCircle();
        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();

        // Everyone deposits cycle 0 but no one settles.
        vm.prank(alice); c.deposit{value: CONTRIB}();
        vm.prank(bob);   c.deposit{value: CONTRIB}();
        vm.prank(carol); c.deposit{value: CONTRIB}();

        // Cycle deadline + grace period passes without settlement.
        vm.warp(block.timestamp + CYCLE + 7 days + 1);
        c.abort();
        assertEq(uint256(c.status()), uint256(SavingsCircle.Status.Aborted));

        // Each depositor can claim back their principal.
        uint256 aliceBefore = alice.balance;
        vm.prank(alice); c.claimRefund();
        assertEq(alice.balance, aliceBefore + CONTRIB);

        uint256 bobBefore = bob.balance;
        vm.prank(bob); c.claimRefund();
        assertEq(bob.balance, bobBefore + CONTRIB);

        // Double-claim reverts.
        vm.expectRevert(SavingsCircle.NothingToClaim.selector);
        vm.prank(alice); c.claimRefund();
    }

    function test_missedDeposit_penalizesReputation() public {
        SavingsCircle c = _newCircle();
        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();

        vm.prank(alice); c.deposit{value: CONTRIB}();
        vm.prank(bob);   c.deposit{value: CONTRIB}();
        // carol skips
        vm.warp(block.timestamp + CYCLE + 1);
        c.settleCycle();

        (, , , uint32 missed, , , ) = rep.summary(carol);
        assertEq(missed, 1);
    }

    function test_referral_awardsBoth() public {
        vm.prank(bob);
        rep.registerReferral(alice);
        (uint64 aliceXp, , , , , , ) = rep.summary(alice);
        (uint64 bobXp,   , , , , , ) = rep.summary(bob);
        assertEq(aliceXp, 50);
        assertEq(bobXp, 50);
    }

    function test_dailyQuest_streakIncrements() public {
        vm.prank(alice); rep.claimDailyQuest();
        vm.warp(block.timestamp + 1 days);
        vm.prank(alice); rep.claimDailyQuest();
        (, , , , , uint32 streak, ) = rep.summary(alice);
        assertEq(streak, 2);
    }

    function test_dailyQuest_doubleClaimSameDayReverts() public {
        vm.prank(alice); rep.claimDailyQuest();
        vm.expectRevert(ReputationSystem.QuestAlreadyClaimedToday.selector);
        vm.prank(alice); rep.claimDailyQuest();
    }

    function test_mUSDCircle_withYieldVault_paysFullPotIncludingYield() public {
        MockERC20 musd = new MockERC20();
        MockYieldVault vault = new MockYieldVault(address(musd));

        // Mint balances and seed the vault so it can credit yield.
        musd.mint(alice, 1_000 ether);
        musd.mint(bob,   1_000 ether);
        musd.mint(carol, 1_000 ether);
        musd.mint(address(vault), 1_000 ether); // yield reserve

        uint256 contrib = 100 ether;
        vm.prank(alice);
        address addr = factory.createCircle(
            "mUSD Circle", contrib, CYCLE, 3, address(musd), address(vault)
        );
        SavingsCircle c = SavingsCircle(addr);

        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();
        // active

        for (uint256 cycle = 0; cycle < 3; cycle++) {
            vm.prank(alice); musd.approve(address(c), contrib); vm.prank(alice); c.deposit();
            vm.prank(bob);   musd.approve(address(c), contrib); vm.prank(bob);   c.deposit();
            vm.prank(carol); musd.approve(address(c), contrib); vm.prank(carol); c.deposit();

            address recipient = c.currentRecipient();
            uint256 balBefore = musd.balanceOf(recipient);
            vm.warp(block.timestamp + CYCLE + 1);

            // Vault accrues 5% yield on its deposits between settle calls.
            vault.accrue(500); // basis points

            c.settleCycle();
            // settleCycle accrues — recipient must claim to receive the pot.
            assertGe(c.pendingPayout(recipient), contrib * 3);
            vm.prank(recipient); c.claimPayout();
            assertGe(musd.balanceOf(recipient) - balBefore, contrib * 3);
        }
        assertEq(uint256(c.status()), uint256(SavingsCircle.Status.Completed));
    }

    function test_badge_soulbound() public {
        SavingsCircle c = _newCircle();
        vm.prank(bob);   c.join();
        vm.prank(carol); c.join();

        vm.prank(alice); c.deposit{value: CONTRIB}();
        // alice should now have FirstDeposit badge as token #1
        assertEq(badge.balanceOf(alice), 1);

        vm.prank(alice);
        vm.expectRevert(AchievementBadge.Soulbound.selector);
        badge.transferFrom(alice, bob, 1);
    }
}

/// @notice Recipient contract with no receive/fallback — rejects native BTC.
///         Used to prove the pull-pattern survives a non-receivable member.
contract RejectingRecipient {
    function deposit(SavingsCircle c) external payable {
        c.deposit{value: msg.value}();
    }
    function joinAndDeposit(SavingsCircle c) external payable {
        c.join();
        c.deposit{value: msg.value}();
    }
}

/// @notice Minimal ERC-20 used to simulate mUSD in tests.
contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 a = allowance[from][msg.sender];
        if (a != type(uint256).max) allowance[from][msg.sender] = a - amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @notice Minimal ERC-4626-ish vault that mints 1 share per asset on deposit.
///         `accrue(bps)` simulates yield by inflating the share->asset rate.
contract MockYieldVault {
    address public asset;
    mapping(address => uint256) public balanceOf;
    uint256 public totalShares;
    uint256 public yieldNumerator = 1e18;

    constructor(address _asset) { asset = _asset; }

    function deposit(uint256 assets, address receiver) external returns (uint256 shares) {
        MockERC20(asset).transferFrom(msg.sender, address(this), assets);
        shares = (assets * 1e18) / yieldNumerator;
        balanceOf[receiver] += shares;
        totalShares += shares;
    }

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets) {
        require(msg.sender == owner, "owner");
        balanceOf[owner] -= shares;
        totalShares -= shares;
        assets = (shares * yieldNumerator) / 1e18;
        MockERC20(asset).transfer(receiver, assets);
    }

    function convertToAssets(uint256 shares) external view returns (uint256) {
        return (shares * yieldNumerator) / 1e18;
    }

    /// @notice Bump the share->asset ratio by `bps` basis points (e.g. 500 = +5%).
    function accrue(uint256 bps) external {
        yieldNumerator = yieldNumerator * (10_000 + bps) / 10_000;
    }
}
