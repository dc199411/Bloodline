// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BloodlineRegistry.sol";

contract BloodlineRegistryTest is Test {
    BloodlineRegistry public registry;

    address owner = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address oracle = makeAddr("oracle");
    address bounty = makeAddr("bounty");
    address vrfConsumer = makeAddr("vrfConsumer");
    address agentWallet = makeAddr("agentWallet");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 100,
        speed: 80,
        creativity: 90,
        frugality: 70,
        riskAppetite: 60,
        socialEnergy: 50,
        loyalty: 85,
        resilience: 95
    });

    function setUp() public {
        registry = new BloodlineRegistry();
        registry.setMetabolismOracle(oracle);
        registry.setBountyBoard(bounty);
        registry.setVRFConsumer(vrfConsumer);
    }

    // ---------------------------------------------------------------
    //  Helpers
    // ---------------------------------------------------------------

    function _birthAsOwner(
        address _ownerAddr,
        address _wallet,
        uint256 _parentId
    ) internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(
            _ownerAddr, _wallet, defaultDNA, _parentId, "ipfs://meta"
        );
    }

    // ---------------------------------------------------------------
    //  testBirthAgent
    // ---------------------------------------------------------------

    function testBirthAgent() public {
        vm.deal(owner, 1 ether);

        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);
        assertEq(agentId, 1);

        BloodlineRegistry.Agent memory a = registry.getAgent(agentId);
        assertEq(a.ownerAddress, alice);
        assertEq(a.agentWallet, agentWallet);
        assertEq(a.parentId, 0);
        assertEq(a.lineageDepth, 0);
        assertTrue(a.stage == BloodlineRegistry.LifeStage.Alive);
        assertEq(a.dna.intelligence, 100);
    }

    function testBirthAgentViaVRFConsumer() public {
        vm.deal(vrfConsumer, 1 ether);
        vm.prank(vrfConsumer);
        uint256 agentId = registry.birthAgent{value: 0.005 ether}(
            alice, agentWallet, defaultDNA, 0, "ipfs://meta"
        );
        assertEq(agentId, 1);
    }

    function testBirthAgentRevertsUnauthorized() public {
        vm.deal(bob, 1 ether);
        vm.prank(bob);
        vm.expectRevert("BloodlineRegistry: only vrfConsumer or owner");
        registry.birthAgent{value: 0.005 ether}(
            alice, agentWallet, defaultDNA, 0, "ipfs://meta"
        );
    }

    function testBirthAgentRevertsInsufficientFee() public {
        vm.deal(owner, 1 ether);
        vm.expectRevert("BloodlineRegistry: insufficient registration fee");
        registry.birthAgent{value: 0.001 ether}(
            alice, agentWallet, defaultDNA, 0, "ipfs://meta"
        );
    }

    // ---------------------------------------------------------------
    //  testForkAgent  (lineageDepth = parent + 1)
    // ---------------------------------------------------------------

    function testForkAgent() public {
        vm.deal(owner, 1 ether);

        uint256 parentId = _birthAsOwner(alice, agentWallet, 0);
        assertEq(registry.getAgent(parentId).lineageDepth, 0);

        address childWallet = makeAddr("childWallet");
        uint256 childId = _birthAsOwner(alice, childWallet, parentId);

        BloodlineRegistry.Agent memory child = registry.getAgent(childId);
        assertEq(child.parentId, parentId);
        assertEq(child.lineageDepth, 1);

        assertEq(registry.getAgent(parentId).offspringCount, 1);

        uint256[] memory children = registry.getChildren(parentId);
        assertEq(children.length, 1);
        assertEq(children[0], childId);
    }

    function testForkAgentDeepLineage() public {
        vm.deal(owner, 1 ether);

        uint256 gen0 = _birthAsOwner(alice, makeAddr("w0"), 0);
        uint256 gen1 = _birthAsOwner(alice, makeAddr("w1"), gen0);
        uint256 gen2 = _birthAsOwner(alice, makeAddr("w2"), gen1);

        assertEq(registry.getAgent(gen0).lineageDepth, 0);
        assertEq(registry.getAgent(gen1).lineageDepth, 1);
        assertEq(registry.getAgent(gen2).lineageDepth, 2);
    }

    // ---------------------------------------------------------------
    //  testKillAgent  (only oracle/authorized can kill)
    // ---------------------------------------------------------------

    function testKillAgentByOracle() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        BloodlineRegistry.Agent memory a = registry.getAgent(agentId);
        assertTrue(a.stage == BloodlineRegistry.LifeStage.Dead);
        assertGt(a.diedAt, 0);
    }

    function testKillAgentByBountyBoard() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(bounty);
        registry.killAgent(agentId, "ipfs://will");

        assertTrue(
            registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Dead
        );
    }

    function testKillAgentByOwner() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        registry.killAgent(agentId, "ipfs://will");

        assertTrue(
            registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Dead
        );
    }

    function testKillAgentRevertsUnauthorized() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(bob);
        vm.expectRevert("BloodlineRegistry: not authorized");
        registry.killAgent(agentId, "ipfs://will");
    }

    function testKillAgentRevertsAlreadyDead() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        registry.killAgent(agentId, "ipfs://will");

        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.killAgent(agentId, "ipfs://will2");
    }

    // ---------------------------------------------------------------
    //  testAscendAgent
    // ---------------------------------------------------------------

    function testAscendAgentByOracle() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(oracle);
        registry.ascendAgent(agentId);

        assertTrue(
            registry.getAgent(agentId).stage == BloodlineRegistry.LifeStage.Ascended
        );
    }

    function testAscendAgentRevertsUnauthorized() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(bob);
        vm.expectRevert("BloodlineRegistry: not authorized");
        registry.ascendAgent(agentId);
    }

    function testAscendAgentRevertsIfDead() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);
        registry.killAgent(agentId, "ipfs://will");

        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.ascendAgent(agentId);
    }

    // ---------------------------------------------------------------
    //  testRecordEarning
    // ---------------------------------------------------------------

    function testRecordEarning() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(oracle);
        registry.recordEarning(agentId, 1000);

        BloodlineRegistry.Agent memory a = registry.getAgent(agentId);
        assertEq(a.totalEarned, 1000);
        assertEq(a.tasksCompleted, 1);

        vm.prank(bounty);
        registry.recordEarning(agentId, 500);

        a = registry.getAgent(agentId);
        assertEq(a.totalEarned, 1500);
        assertEq(a.tasksCompleted, 2);
    }

    function testRecordEarningRevertsUnauthorized() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);

        vm.prank(bob);
        vm.expectRevert("BloodlineRegistry: not authorized");
        registry.recordEarning(agentId, 1000);
    }

    function testRecordEarningRevertsIfDead() public {
        vm.deal(owner, 1 ether);
        uint256 agentId = _birthAsOwner(alice, agentWallet, 0);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(oracle);
        vm.expectRevert("BloodlineRegistry: agent not alive");
        registry.recordEarning(agentId, 1000);
    }
}
