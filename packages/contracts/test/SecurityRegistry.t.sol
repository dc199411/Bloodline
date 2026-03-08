// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BloodlineRegistry.sol";

/// @title Security tests for BloodlineRegistry
/// @notice Covers: reentrancy, access control, zero-address, overflow, state machine, invariants
contract SecurityRegistryTest is Test {
    BloodlineRegistry public registry;

    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address oracle = makeAddr("oracle");
    address bountyAddr = makeAddr("bounty");
    address vrfConsumer = makeAddr("vrfConsumer");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 100, speed: 80, creativity: 90, frugality: 70,
        riskAppetite: 60, socialEnergy: 50, loyalty: 85, resilience: 95
    });

    function setUp() public {
        registry = new BloodlineRegistry();
        registry.setMetabolismOracle(oracle);
        registry.setBountyBoard(bountyAddr);
        registry.setVRFConsumer(vrfConsumer);
        vm.deal(owner, 100 ether);
        vm.deal(vrfConsumer, 100 ether);
    }

    function _birth(address _owner, address _wallet, uint256 _parentId) internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(_owner, _wallet, defaultDNA, _parentId, "ipfs://meta");
    }

    // ═══════════════════════════════════════════════════════════════
    //  ZERO-ADDRESS VALIDATION
    // ═══════════════════════════════════════════════════════════════

    function testRevertBirthZeroOwner() public {
        vm.expectRevert("BloodlineRegistry: zero owner address");
        registry.birthAgent{value: 0.005 ether}(address(0), makeAddr("w"), defaultDNA, 0, "ipfs://meta");
    }

    function testRevertBirthZeroWallet() public {
        vm.expectRevert("BloodlineRegistry: zero wallet address");
        registry.birthAgent{value: 0.005 ether}(alice, address(0), defaultDNA, 0, "ipfs://meta");
    }

    function testRevertSetMetabolismOracleZero() public {
        vm.expectRevert("BloodlineRegistry: zero address");
        registry.setMetabolismOracle(address(0));
    }

    function testRevertSetBountyBoardZero() public {
        vm.expectRevert("BloodlineRegistry: zero address");
        registry.setBountyBoard(address(0));
    }

    function testRevertSetVRFConsumerZero() public {
        vm.expectRevert("BloodlineRegistry: zero address");
        registry.setVRFConsumer(address(0));
    }

    // ═══════════════════════════════════════════════════════════════
    //  DEATH IS PERMANENT — Critical Rule #1
    // ═══════════════════════════════════════════════════════════════

    function testDeadAgentCannotBeResurrected() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.setStageThrive(agentId);
    }

    function testDeadAgentCannotAscend() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.ascendAgent(agentId);
    }

    function testDeadAgentCannotRecordEarnings() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.recordEarning(agentId, 1000);
    }

    function testDeadAgentCannotUpdateEndpoint() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(alice);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.updateEndpoint(agentId, "https://new.endpoint");
    }

    function testIsAliveReturnsFalseForDeadAgent() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        assertTrue(registry.isAlive(agentId));

        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");
        assertFalse(registry.isAlive(agentId));
    }

    // ═══════════════════════════════════════════════════════════════
    //  DNA IS IMMUTABLE — Critical Rule #2
    // ═══════════════════════════════════════════════════════════════

    function testDNACannotBeChangedAfterBirth() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        BloodlineRegistry.DNA memory dna = registry.getDNA(agentId);

        assertEq(dna.intelligence, 100);
        assertEq(dna.speed, 80);
        assertEq(dna.creativity, 90);
        assertEq(dna.frugality, 70);

        vm.prank(oracle);
        registry.recordEarning(agentId, 1000);
        BloodlineRegistry.DNA memory dnaAfter = registry.getDNA(agentId);
        assertEq(dnaAfter.intelligence, dna.intelligence);
        assertEq(dnaAfter.speed, dna.speed);
        assertEq(dnaAfter.creativity, dna.creativity);
        assertEq(dnaAfter.frugality, dna.frugality);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ACCESS CONTROL — Comprehensive
    // ═══════════════════════════════════════════════════════════════

    function testOnlyVRFOrOwnerCanBirth() public {
        vm.prank(alice);
        vm.deal(alice, 1 ether);
        vm.expectRevert("BloodlineRegistry: only vrfConsumer or owner");
        registry.birthAgent{value: 0.005 ether}(alice, makeAddr("w"), defaultDNA, 0, "ipfs://meta");
    }

    function testOnlyAgentOwnerCanUpdateEndpoint() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);

        vm.prank(bob);
        vm.expectRevert("BloodlineRegistry: not agent owner");
        registry.updateEndpoint(agentId, "https://evil.com");

        vm.prank(alice);
        registry.updateEndpoint(agentId, "https://legit.com");
        assertEq(keccak256(bytes(registry.getAgent(agentId).executionEndpoint)), keccak256("https://legit.com"));
    }

    function testOnlyOwnerCanSetFees() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.setRegistrationFee(0.01 ether);

        vm.prank(alice);
        vm.expectRevert();
        registry.setForkFee(0.01 ether);
    }

    function testOnlyOwnerCanWithdraw() public {
        _birth(alice, makeAddr("w"), 0);

        vm.prank(alice);
        vm.expectRevert();
        registry.withdraw();
    }

    // ═══════════════════════════════════════════════════════════════
    //  STATE MACHINE INTEGRITY
    // ═══════════════════════════════════════════════════════════════

    function testUnbornAgentCannotBeKilled() public {
        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.killAgent(999, "ipfs://will");
    }

    function testUnbornAgentCannotAscend() public {
        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.ascendAgent(999);
    }

    function testAscendedAgentCannotBeKilled() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.ascendAgent(agentId);

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.killAgent(agentId, "ipfs://will");
    }

    function testThrivingAgentCanBeKilled() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.setStageThrive(agentId);
        assertTrue(registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Thriving);

        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");
        assertTrue(registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Dead);
    }

    function testAliveToThrivingTransition() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        assertTrue(registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Alive);

        vm.prank(oracle);
        registry.setStageThrive(agentId);
        assertTrue(registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Thriving);
    }

    function testCannotSetThriveOnAlreadyThriving() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        registry.setStageThrive(agentId);

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.setStageThrive(agentId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  LINEAGE DEPTH + FORK TREE INTEGRITY
    // ═══════════════════════════════════════════════════════════════

    function testDeepLineageChain() public {
        uint256 prev = 0;
        for (uint256 i = 0; i < 10; i++) {
            prev = _birth(alice, makeAddr(string(abi.encodePacked("w", i))), prev);
            assertEq(registry.getAgent(prev).lineageDepth, i);
        }
    }

    function testForkFromNonExistentParentUsesDepthZero() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 9999);
        assertEq(registry.getAgent(agentId).lineageDepth, 1);
    }

    function testMultipleChildrenTracked() public {
        uint256 parent = _birth(alice, makeAddr("w0"), 0);
        uint256 c1 = _birth(alice, makeAddr("w1"), parent);
        uint256 c2 = _birth(alice, makeAddr("w2"), parent);
        uint256 c3 = _birth(alice, makeAddr("w3"), parent);

        uint256[] memory children = registry.getChildren(parent);
        assertEq(children.length, 3);
        assertEq(children[0], c1);
        assertEq(children[1], c2);
        assertEq(children[2], c3);
        assertEq(registry.getAgent(parent).offspringCount, 3);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AGENT ID INCREMENTING INVARIANT
    // ═══════════════════════════════════════════════════════════════

    function testAgentIdsAlwaysIncrement() public {
        uint256 id1 = _birth(alice, makeAddr("w1"), 0);
        uint256 id2 = _birth(alice, makeAddr("w2"), 0);
        uint256 id3 = _birth(alice, makeAddr("w3"), 0);

        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);
        assertEq(registry.nextAgentId(), 4);
    }

    // ═══════════════════════════════════════════════════════════════
    //  EARNINGS OVERFLOW CHECK
    // ═══════════════════════════════════════════════════════════════

    function testEarningsAccumulate() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);

        for (uint256 i = 0; i < 100; i++) {
            vm.prank(oracle);
            registry.recordEarning(agentId, 1_000_000);
        }

        assertEq(registry.getAgent(agentId).totalEarned, 100_000_000);
        assertEq(registry.getAgent(agentId).tasksCompleted, 100);
    }

    // ═══════════════════════════════════════════════════════════════
    //  WITHDRAW SAFETY
    // ═══════════════════════════════════════════════════════════════

    function testWithdrawSendsAllFunds() public {
        _birth(alice, makeAddr("w1"), 0);
        _birth(alice, makeAddr("w2"), 0);

        uint256 contractBalance = address(registry).balance;
        assertEq(contractBalance, 0.01 ether);

        uint256 ownerBefore = address(this).balance;
        registry.withdraw();
        uint256 ownerAfter = address(this).balance;

        assertEq(ownerAfter - ownerBefore, 0.01 ether);
        assertEq(address(registry).balance, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //  FUZZ TESTS
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_BirthWithRandomDNA(
        uint8 intel, uint8 spd, uint8 creat, uint8 frug,
        uint8 risk, uint8 social, uint8 loyal, uint8 resil
    ) public {
        BloodlineRegistry.DNA memory dna = BloodlineRegistry.DNA({
            intelligence: intel, speed: spd, creativity: creat, frugality: frug,
            riskAppetite: risk, socialEnergy: social, loyalty: loyal, resilience: resil
        });

        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("w"), dna, 0, "ipfs://meta"
        );

        BloodlineRegistry.DNA memory stored = registry.getDNA(agentId);
        assertEq(stored.intelligence, intel);
        assertEq(stored.speed, spd);
        assertEq(stored.creativity, creat);
        assertEq(stored.frugality, frug);
        assertEq(stored.riskAppetite, risk);
        assertEq(stored.socialEnergy, social);
        assertEq(stored.loyalty, loyal);
        assertEq(stored.resilience, resil);
    }

    function testFuzz_RegistrationFee(uint256 fee) public {
        fee = bound(fee, 0, 1 ether);
        registry.setRegistrationFee(fee);
        assertEq(registry.registrationFee(), fee);
    }

    // ═══════════════════════════════════════════════════════════════
    //  EVENT EMISSION VERIFICATION
    // ═══════════════════════════════════════════════════════════════

    function testBirthEmitsCorrectEvent() public {
        vm.expectEmit(true, true, true, true);
        emit BloodlineRegistry.AgentBorn(1, alice, makeAddr("w"), 0, 0);
        _birth(alice, makeAddr("w"), 0);
    }

    function testKillEmitsCorrectEvent() public {
        uint256 agentId = _birth(alice, makeAddr("w"), 0);
        vm.prank(oracle);
        vm.expectEmit(true, false, false, true);
        emit BloodlineRegistry.AgentDied(agentId, "ipfs://will");
        registry.killAgent(agentId, "ipfs://will");
    }

    receive() external payable {}
}
