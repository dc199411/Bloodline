// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MetabolismOracle.sol";
import "../src/BloodlineRegistry.sol";
import "../src/BloodlineNFT.sol";

/// @title Security tests for MetabolismOracle
contract SecurityMetabolismTest is Test {
    MetabolismOracle public metabolism;
    BloodlineRegistry public registry;
    BloodlineNFT public nft;

    address deployer = address(this);
    address alice = makeAddr("alice");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 100, speed: 80, creativity: 90, frugality: 70,
        riskAppetite: 60, socialEnergy: 50, loyalty: 85, resilience: 95
    });

    function setUp() public {
        registry = new BloodlineRegistry();
        nft = new BloodlineNFT(address(registry));
        metabolism = new MetabolismOracle(address(registry), address(nft), address(0));

        registry.setMetabolismOracle(address(metabolism));
        registry.setVRFConsumer(deployer);
        nft.addAuthorized(address(metabolism));

        vm.deal(deployer, 100 ether);
    }

    function _birth() internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("wallet"), defaultDNA, 0, "ipfs://meta"
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //  BURN RATE CALCULATION — Critical: always positive
    // ═══════════════════════════════════════════════════════════════

    function testBurnRateAlwaysPositive() public view {
        for (uint8 i = 0; i < 255; i++) {
            uint256 rate = metabolism._calculateBurnRate(i);
            assertGt(rate, 0, "Burn rate must be positive for all frugality values");
        }
        uint256 rate255 = metabolism._calculateBurnRate(255);
        assertGt(rate255, 0, "Burn rate must be positive even at frugality=255");
    }

    function testBurnRateMaxAtFrugalityZero() public view {
        uint256 rateMin = metabolism._calculateBurnRate(0);
        uint256 rateMax = metabolism._calculateBurnRate(255);
        assertGt(rateMin, rateMax, "Frugality=0 should have higher burn than frugality=255");
    }

    function testFuzz_BurnRateAlwaysPositive(uint8 frugality) public view {
        uint256 rate = metabolism._calculateBurnRate(frugality);
        assertGt(rate, 0, "Burn rate must always be > 0");
    }

    function testBurnRateFrugality255MinimumGuarantee() public view {
        uint256 rate = metabolism._calculateBurnRate(255);
        assertGe(rate, 1, "Minimum burn rate must be at least 1 (MIN_BURN_RATE)");
    }

    function testBurnRateMonotonicallyDecreasing() public view {
        uint256 prevRate = metabolism._calculateBurnRate(0);
        for (uint8 i = 1; i < 255; i++) {
            uint256 rate = metabolism._calculateBurnRate(i);
            assertLe(rate, prevRate, "Burn rate should decrease as frugality increases");
            prevRate = rate;
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  AGENT REGISTRATION
    // ═══════════════════════════════════════════════════════════════

    function testRegisterAgentSetsState() public {
        uint256 agentId = _birth();
        metabolism.registerAgent(agentId);

        assertTrue(metabolism.registered(agentId));
        assertEq(metabolism.lastCheck(agentId), block.timestamp);
    }

    function testRevertDoubleRegistration() public {
        uint256 agentId = _birth();
        metabolism.registerAgent(agentId);

        vm.expectRevert("MetabolismOracle: already registered");
        metabolism.registerAgent(agentId);
    }

    function testRevertUnauthorizedRegistration() public {
        uint256 agentId = _birth();

        vm.prank(alice);
        vm.expectRevert("MetabolismOracle: not registry");
        metabolism.registerAgent(agentId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  CHAINLINK AUTOMATION INTERFACE
    // ═══════════════════════════════════════════════════════════════

    function testCheckUpkeepNoAgents() public {
        (bool needed,) = metabolism.checkUpkeep("");
        assertFalse(needed);
    }

    function testCheckUpkeepWithRegisteredAgent() public {
        uint256 agentId = _birth();
        metabolism.registerAgent(agentId);

        vm.warp(block.timestamp + 2 hours);

        (bool needed, bytes memory data) = metabolism.checkUpkeep("");
        assertTrue(needed);

        uint256[] memory ids = abi.decode(data, (uint256[]));
        assertEq(ids.length, 1);
        assertEq(ids[0], agentId);
    }

    function testCheckUpkeepRespectsInterval() public {
        uint256 agentId = _birth();
        metabolism.registerAgent(agentId);

        (bool needed,) = metabolism.checkUpkeep("");
        assertFalse(needed, "Should not need check immediately after registration");

        vm.warp(block.timestamp + 30 minutes);
        (needed,) = metabolism.checkUpkeep("");
        assertFalse(needed, "Should not need check before interval");

        vm.warp(block.timestamp + 31 minutes);
        (needed,) = metabolism.checkUpkeep("");
        assertTrue(needed, "Should need check after interval");
    }

    function testCheckUpkeepMaxBatch() public {
        for (uint256 i = 0; i < 25; i++) {
            uint256 agentId = registry.birthAgent{value: 0.005 ether}(
                alice, makeAddr(string(abi.encodePacked("w", i))), defaultDNA, 0, "ipfs://meta"
            );
            metabolism.registerAgent(agentId);
        }

        vm.warp(block.timestamp + 2 hours);

        (, bytes memory data) = metabolism.checkUpkeep("");
        uint256[] memory ids = abi.decode(data, (uint256[]));
        assertLe(ids.length, 20, "Should not exceed MAX_CHECK_BATCH");
    }

    function testCheckUpkeepSkipsDeadAgents() public {
        uint256 agentId = _birth();
        metabolism.registerAgent(agentId);

        registry.killAgent(agentId, "ipfs://will");

        vm.warp(block.timestamp + 2 hours);

        (bool needed,) = metabolism.checkUpkeep("");
        assertFalse(needed, "Should not check dead agents");
    }

    // ═══════════════════════════════════════════════════════════════
    //  FINALIZE KILL — Access control
    // ═══════════════════════════════════════════════════════════════

    function testRevertFinalizeKillUnauthorized() public {
        uint256 agentId = _birth();

        vm.prank(alice);
        vm.expectRevert("MetabolismOracle: not registry");
        metabolism.finalizeKill(agentId, "ipfs://will");
    }

    function testRevertFinalizeKillAlreadyDead() public {
        uint256 agentId = _birth();
        registry.killAgent(agentId, "ipfs://will");

        vm.expectRevert("MetabolismOracle: agent not alive");
        metabolism.finalizeKill(agentId, "ipfs://will2");
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertSetRegistryUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        metabolism.setRegistry(address(0));
    }

    function testRevertSetNFTUnauthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        metabolism.setNFT(address(0));
    }

    receive() external payable {}
}
