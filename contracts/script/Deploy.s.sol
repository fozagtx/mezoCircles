// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";
import {SavingsCircleFactory} from "../src/SavingsCircleFactory.sol";
import {ReputationSystem} from "../src/ReputationSystem.sol";
import {AchievementBadge} from "../src/AchievementBadge.sol";

contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        string memory baseURI = vm.envOr("BADGE_BASE_URI", string("ipfs://placeholder/"));

        vm.startBroadcast(pk);

        // 1. Implementation (clones target this).
        SavingsCircle impl = new SavingsCircle();

        // 2. Reputation + badge systems.
        ReputationSystem rep = new ReputationSystem();
        AchievementBadge badge = new AchievementBadge(baseURI);

        // 3. Factory wired to all three.
        SavingsCircleFactory factory = new SavingsCircleFactory(
            address(impl),
            address(rep),
            address(badge)
        );

        // 4. Hand factory the right to authorize new circles.
        rep.setFactory(address(factory));
        badge.setFactory(address(factory));

        vm.stopBroadcast();

        console2.log("Implementation:    ", address(impl));
        console2.log("ReputationSystem:  ", address(rep));
        console2.log("AchievementBadge:  ", address(badge));
        console2.log("Factory:           ", address(factory));
    }
}
