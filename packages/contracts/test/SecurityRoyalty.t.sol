// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/RoyaltyRouter.sol";
import "../src/BloodlineRegistry.sol";

contract MockUSDCRoyalty is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 100_000_000 * 1e6);
    }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
    function decimals() public pure override returns (uint8) { return 6; }
}

/// @title Security tests for RoyaltyRouter — lineage royalty distribution
contract SecurityRoyaltyTest is Test {
    RoyaltyRouter public router;
    BloodlineRegistry public registry;
    MockUSDCRoyalty public usdc;

    address deployer = address(this);
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 100, speed: 80, creativity: 90, frugality: 70,
        riskAppetite: 60, socialEnergy: 50, loyalty: 85, resilience: 95
    });

    function setUp() public {
        usdc = new MockUSDCRoyalty();
        registry = new BloodlineRegistry();
        router = new RoyaltyRouter(address(usdc), address(registry), treasury);

        registry.setVRFConsumer(deployer);
        registry.setMetabolismOracle(deployer);
        router.addAuthorized(deployer);

        vm.deal(deployer, 100 ether);
    }

    function _birth(address wallet, uint256 parentId) internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(
            alice, wallet, defaultDNA, parentId, "ipfs://meta"
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //  ROYALTY PERCENTAGE VERIFICATION
    // ═══════════════════════════════════════════════════════════════

    function testRoyaltyConstants() public view {
        assertEq(router.CHILD_ROYALTY_BPS(), 1000, "Child royalty should be 10%");
        assertEq(router.GRANDCHILD_ROYALTY_BPS(), 300, "Grandchild royalty should be 3%");
        assertEq(router.GREAT_GRANDCHILD_ROYALTY_BPS(), 100, "Great-grandchild should be 1%");
        assertEq(router.PROTOCOL_FEE_BPS(), 20, "Protocol fee should be 0.2%");
    }

    function testRoyaltyDistributionToParent() public {
        address parentWallet = makeAddr("parentWallet");
        address childWallet = makeAddr("childWallet");

        uint256 parentId = _birth(parentWallet, 0);
        uint256 childId = _birth(childWallet, parentId);

        uint256 amount = 10_000 * 1e6;
        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        uint256 parentBefore = usdc.balanceOf(parentWallet);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        router.routeEarning(childId, amount);

        uint256 expectedParentShare = (amount * 1000) / 10_000;
        uint256 expectedProtocolFee = (amount * 20) / 10_000;

        assertEq(usdc.balanceOf(parentWallet) - parentBefore, expectedParentShare);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, expectedProtocolFee);
    }

    function testThreeGenerationRoyalties() public {
        address gpWallet = makeAddr("gpWallet");
        address parentWallet = makeAddr("parentWallet");
        address childWallet = makeAddr("childWallet");

        uint256 gpId = _birth(gpWallet, 0);
        uint256 parentId = _birth(parentWallet, gpId);
        uint256 childId = _birth(childWallet, parentId);

        uint256 amount = 10_000 * 1e6;
        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        uint256 parentBefore = usdc.balanceOf(parentWallet);
        uint256 gpBefore = usdc.balanceOf(gpWallet);

        router.routeEarning(childId, amount);

        uint256 expectedParent = (amount * 1000) / 10_000;
        uint256 expectedGP = (amount * 300) / 10_000;

        assertEq(usdc.balanceOf(parentWallet) - parentBefore, expectedParent);
        assertEq(usdc.balanceOf(gpWallet) - gpBefore, expectedGP);
    }

    // ═══════════════════════════════════════════════════════════════
    //  DEAD ANCESTOR SKIPPING — Royalties do NOT go to dead agents
    // ═══════════════════════════════════════════════════════════════

    function testDeadParentGetsNoRoyalty() public {
        address parentWallet = makeAddr("parentWallet");
        address childWallet = makeAddr("childWallet");

        uint256 parentId = _birth(parentWallet, 0);
        uint256 childId = _birth(childWallet, parentId);

        registry.killAgent(parentId, "ipfs://will");

        uint256 amount = 10_000 * 1e6;
        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        uint256 parentBefore = usdc.balanceOf(parentWallet);
        uint256 childBefore = usdc.balanceOf(childWallet);

        router.routeEarning(childId, amount);

        assertEq(usdc.balanceOf(parentWallet), parentBefore, "Dead parent should receive nothing");
        assertGt(usdc.balanceOf(childWallet) - childBefore, 0, "Child should get more when parent is dead");
    }

    // ═══════════════════════════════════════════════════════════════
    //  GENESIS AGENT — No ancestors, all goes to agent
    // ═══════════════════════════════════════════════════════════════

    function testGenesisAgentGetsAllMinusProtocol() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        uint256 amount = 10_000 * 1e6;
        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        uint256 agentBefore = usdc.balanceOf(agentWallet);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        router.routeEarning(agentId, amount);

        uint256 expectedProtocol = (amount * 20) / 10_000;
        uint256 expectedAgent = amount - expectedProtocol;

        assertEq(usdc.balanceOf(treasury) - treasuryBefore, expectedProtocol);
        assertEq(usdc.balanceOf(agentWallet) - agentBefore, expectedAgent);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ZERO AMOUNT PREVENTION
    // ═══════════════════════════════════════════════════════════════

    function testRevertZeroAmountRouting() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        vm.expectRevert("RoyaltyRouter: zero amount");
        router.routeEarning(agentId, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════

    function testRevertUnauthorizedRouting() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        vm.prank(alice);
        vm.expectRevert("RoyaltyRouter: not authorized");
        router.routeEarning(agentId, 1000);
    }

    function testRevertUnauthorizedLegacyDistribution() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(alice);
        vm.expectRevert("RoyaltyRouter: not authorized");
        router.distributeLegacyPool(agentId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  LEGACY POOL — Dead agent balance split
    // ═══════════════════════════════════════════════════════════════

    function testLegacyPoolRequiresDeadAgent() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        vm.expectRevert();
        router.distributeLegacyPool(agentId);
    }

    function testLegacyPoolNoBalanceReverts() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);
        registry.killAgent(agentId, "ipfs://will");

        vm.expectRevert();
        router.distributeLegacyPool(agentId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  FUZZ: Royalty amounts
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_RoyaltyAmountInBounds(uint256 amount) public {
        amount = bound(amount, 1, 1_000_000 * 1e6);

        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        uint256 agentBefore = usdc.balanceOf(agentWallet);
        uint256 treasuryBefore = usdc.balanceOf(treasury);

        router.routeEarning(agentId, amount);

        uint256 agentReceived = usdc.balanceOf(agentWallet) - agentBefore;
        uint256 treasuryReceived = usdc.balanceOf(treasury) - treasuryBefore;

        assertEq(agentReceived + treasuryReceived, amount, "All USDC must be accounted for");
    }

    // ═══════════════════════════════════════════════════════════════
    //  INVARIANT: No USDC stuck in router
    // ═══════════════════════════════════════════════════════════════

    function testNoUSDCStuckInRouter() public {
        address agentWallet = makeAddr("agentWallet");
        uint256 agentId = _birth(agentWallet, 0);

        uint256 amount = 10_000 * 1e6;
        usdc.transfer(deployer, amount);
        usdc.approve(address(router), amount);

        router.routeEarning(agentId, amount);

        assertEq(usdc.balanceOf(address(router)), 0, "Router should not hold any USDC");
    }

    receive() external payable {}
}
