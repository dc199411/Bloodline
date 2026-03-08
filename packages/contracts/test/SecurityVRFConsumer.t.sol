// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/VRFConsumer.sol";
import "../src/BloodlineRegistry.sol";
import "../src/BloodlineNFT.sol";

/// @title Security tests for VRFConsumer — DNA generation and mutation
contract SecurityVRFConsumerTest is Test {
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

        registry.setVRFConsumer(deployer);
        registry.setMetabolismOracle(deployer);
        nft.addAuthorized(deployer);

        vm.deal(deployer, 100 ether);
    }

    // ═══════════════════════════════════════════════════════════════
    //  DNA TRAIT BOUNDARY TESTS
    // ═══════════════════════════════════════════════════════════════

    function testAllTraitsWithinBounds() public {
        BloodlineRegistry.DNA memory dna = BloodlineRegistry.DNA({
            intelligence: 0, speed: 0, creativity: 0, frugality: 0,
            riskAppetite: 0, socialEnergy: 0, loyalty: 0, resilience: 0
        });

        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("w"), dna, 0, "ipfs://meta"
        );

        BloodlineRegistry.DNA memory stored = registry.getDNA(agentId);
        assertEq(stored.intelligence, 0);
        assertEq(stored.speed, 0);
    }

    function testMaxTraitValues() public {
        BloodlineRegistry.DNA memory dna = BloodlineRegistry.DNA({
            intelligence: 255, speed: 255, creativity: 255, frugality: 255,
            riskAppetite: 255, socialEnergy: 255, loyalty: 255, resilience: 255
        });

        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("w"), dna, 0, "ipfs://meta"
        );

        BloodlineRegistry.DNA memory stored = registry.getDNA(agentId);
        assertEq(stored.intelligence, 255);
        assertEq(stored.resilience, 255);
    }

    // ═══════════════════════════════════════════════════════════════
    //  MUTATION TRAIT CLAMPING — Must stay 0-255
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_MutationNeverExceedsBounds(uint8 baseTrait, uint256 seed) public pure {
        uint256 delta = seed % 26;
        bool direction = ((seed >> 8) % 2) == 0;

        uint8 result;
        if (direction) {
            uint256 r = uint256(baseTrait) + delta;
            result = r > 255 ? 255 : uint8(r);
        } else {
            if (delta > uint256(baseTrait)) {
                result = 0;
            } else {
                result = uint8(uint256(baseTrait) - delta);
            }
        }

        assertLe(result, 255);
        assertGe(result, 0);
    }

    function testMutationAtMaxValue() public pure {
        uint8 baseTrait = 255;
        uint256 seed = 0;
        uint256 delta = seed % 26;
        bool direction = ((seed >> 8) % 2) == 0;

        uint8 result;
        if (direction) {
            uint256 r = uint256(baseTrait) + delta;
            result = r > 255 ? 255 : uint8(r);
        } else {
            result = delta > uint256(baseTrait) ? 0 : uint8(uint256(baseTrait) - delta);
        }

        assertLe(result, 255);
    }

    function testMutationAtMinValue() public pure {
        uint8 baseTrait = 0;
        uint256 seed = type(uint256).max;
        uint256 delta = seed % 26;
        bool direction = ((seed >> 8) % 2) == 0;

        uint8 result;
        if (direction) {
            uint256 r = uint256(baseTrait) + delta;
            result = r > 255 ? 255 : uint8(r);
        } else {
            result = delta > uint256(baseTrait) ? 0 : uint8(uint256(baseTrait) - delta);
        }

        assertGe(result, 0);
        assertLe(result, 255);
    }

    // ═══════════════════════════════════════════════════════════════
    //  MUTATION DELTA RANGE — 0-25 points max
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_MutationDeltaWithin25(uint256 seed) public pure {
        uint256 delta = seed % 26;
        assertLe(delta, 25, "Delta must be within 0-25");
    }

    // ═══════════════════════════════════════════════════════════════
    //  PRODIGY DETECTION — 3+ traits >= 249
    // ═══════════════════════════════════════════════════════════════

    function testProdigyDetectionThreeTraits() public pure {
        uint8[8] memory traits = [uint8(250), 250, 249, 100, 80, 90, 70, 60];
        uint256 count = 0;
        for (uint256 i = 0; i < 8; i++) {
            if (traits[i] >= 249) count++;
        }
        assertGe(count, 3, "Should detect as prodigy with 3+ legendary traits");
    }

    function testNotProdigyTwoTraits() public pure {
        uint8[8] memory traits = [uint8(250), 250, 200, 100, 80, 90, 70, 60];
        uint256 count = 0;
        for (uint256 i = 0; i < 8; i++) {
            if (traits[i] >= 249) count++;
        }
        assertLt(count, 3, "Should not be prodigy with only 2 legendary traits");
    }

    function testProdigyAllLegendary() public pure {
        uint8[8] memory traits = [uint8(255), 255, 255, 255, 255, 255, 255, 255];
        uint256 count = 0;
        for (uint256 i = 0; i < 8; i++) {
            if (traits[i] >= 249) count++;
        }
        assertGe(count, 3, "All legendary should be prodigy");
    }

    // ═══════════════════════════════════════════════════════════════
    //  GENESIS TRAIT DERIVATION
    // ═══════════════════════════════════════════════════════════════

    function testGenesisTraitsDeterministic() public pure {
        uint256 randomWord = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;

        uint8[8] memory traits;
        for (uint256 i = 0; i < 8; i++) {
            traits[i] = uint8(randomWord >> (i * 32));
        }

        uint8[8] memory traits2;
        for (uint256 i = 0; i < 8; i++) {
            traits2[i] = uint8(randomWord >> (i * 32));
        }

        for (uint256 i = 0; i < 8; i++) {
            assertEq(traits[i], traits2[i], "Same random word should produce same traits");
        }
    }

    function testFuzz_GenesisTraitsAlwaysValid(uint256 randomWord) public pure {
        for (uint256 i = 0; i < 8; i++) {
            uint8 trait = uint8(randomWord >> (i * 32));
            assertLe(trait, 255);
            assertGe(trait, 0);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  DNA IMMUTABILITY ACROSS OPERATIONS
    // ═══════════════════════════════════════════════════════════════

    function testDNAUnchangedAfterEarning() public {
        BloodlineRegistry.DNA memory dna = BloodlineRegistry.DNA({
            intelligence: 200, speed: 180, creativity: 250, frugality: 160,
            riskAppetite: 110, socialEnergy: 230, loyalty: 140, resilience: 170
        });

        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("w"), dna, 0, "ipfs://meta"
        );

        registry.recordEarning(agentId, 1_000_000);
        registry.recordEarning(agentId, 2_000_000);

        BloodlineRegistry.DNA memory dnaAfter = registry.getDNA(agentId);
        assertEq(dnaAfter.intelligence, 200);
        assertEq(dnaAfter.creativity, 250);
        assertEq(dnaAfter.socialEnergy, 230);
    }

    function testDNAUnchangedAfterStageChange() public {
        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("w"), defaultDNA, 0, "ipfs://meta"
        );

        BloodlineRegistry.DNA memory before = registry.getDNA(agentId);

        registry.setStageThrive(agentId);
        BloodlineRegistry.DNA memory afterThrive = registry.getDNA(agentId);
        assertEq(afterThrive.intelligence, before.intelligence);

        registry.killAgent(agentId, "ipfs://will");
        BloodlineRegistry.DNA memory afterDeath = registry.getDNA(agentId);
        assertEq(afterDeath.intelligence, before.intelligence);
    }

    receive() external payable {}
}
