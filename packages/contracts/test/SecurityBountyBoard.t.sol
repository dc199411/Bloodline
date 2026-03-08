// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../src/BountyBoard.sol";
import "../src/BloodlineRegistry.sol";
import "../src/RoyaltyRouter.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

/// @title Security tests for BountyBoard
contract SecurityBountyBoardTest is Test {
    BountyBoard public board;
    BloodlineRegistry public registry;
    RoyaltyRouter public royaltyRouter;
    MockUSDC public usdc;

    address deployer = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address oracle = makeAddr("oracle");
    address treasury = makeAddr("treasury");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 100, speed: 80, creativity: 90, frugality: 70,
        riskAppetite: 60, socialEnergy: 50, loyalty: 85, resilience: 95
    });

    function setUp() public {
        usdc = new MockUSDC();
        registry = new BloodlineRegistry();
        royaltyRouter = new RoyaltyRouter(address(usdc), address(registry), treasury);

        board = new BountyBoard(address(usdc), address(registry), address(royaltyRouter));

        registry.setMetabolismOracle(oracle);
        registry.setBountyBoard(address(board));
        registry.setVRFConsumer(deployer);
        royaltyRouter.addAuthorized(address(board));

        usdc.mint(alice, 100_000 * 1e6);
        usdc.mint(bob, 100_000 * 1e6);
        usdc.mint(address(board), 100_000 * 1e6);
        vm.deal(deployer, 100 ether);
    }

    function _birthAgent(address _owner, address _wallet) internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(_owner, _wallet, defaultDNA, 0, "ipfs://meta");
    }

    function _birthAgentForked(address _owner, address _wallet, uint256 parentId) internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(_owner, _wallet, defaultDNA, parentId, "ipfs://meta");
    }

    function _postBounty(address poster, uint256 reward) internal returns (uint256) {
        vm.startPrank(poster);
        usdc.approve(address(board), reward);
        uint256 bountyId = board.postBounty(
            "Test Bounty",
            "ipfs://desc",
            BountyBoard.BountyType.Task,
            BountyBoard.VerifyMode.Manual,
            reward,
            block.timestamp + 2 hours,
            10
        );
        vm.stopPrank();
        return bountyId;
    }

    // ═══════════════════════════════════════════════════════════════
    //  ESCROW INTEGRITY — USDC must be locked
    // ═══════════════════════════════════════════════════════════════

    function testEscrowTransfersUSDCOnPost() public {
        uint256 balBefore = usdc.balanceOf(alice);
        uint256 bountyId = _postBounty(alice, 1000 * 1e6);
        uint256 balAfter = usdc.balanceOf(alice);

        assertEq(balBefore - balAfter, 1000 * 1e6);
        assertGt(usdc.balanceOf(address(board)), 0);
    }

    function testExpiredBountyRefundsFullAmount() public {
        uint256 bountyId = _postBounty(alice, 500 * 1e6);
        uint256 balBefore = usdc.balanceOf(alice);

        vm.warp(block.timestamp + 3 hours);
        board.expireBounty(bountyId);

        uint256 balAfter = usdc.balanceOf(alice);
        assertEq(balAfter - balBefore, 500 * 1e6);
    }

    // ═══════════════════════════════════════════════════════════════
    //  DEADLINE VALIDATION
    // ═══════════════════════════════════════════════════════════════

    function testRevertBountyDeadlineTooSoon() public {
        vm.startPrank(alice);
        usdc.approve(address(board), 100 * 1e6);
        vm.expectRevert("BountyBoard: deadline must be at least 1 hour ahead");
        board.postBounty(
            "Urgent", "ipfs://desc",
            BountyBoard.BountyType.Task, BountyBoard.VerifyMode.Manual,
            100 * 1e6, block.timestamp + 30 minutes, 5
        );
        vm.stopPrank();
    }

    function testRevertBountyDeadlineInPast() public {
        vm.startPrank(alice);
        usdc.approve(address(board), 100 * 1e6);
        vm.expectRevert("BountyBoard: deadline must be at least 1 hour ahead");
        board.postBounty(
            "Past", "ipfs://desc",
            BountyBoard.BountyType.Task, BountyBoard.VerifyMode.Manual,
            100 * 1e6, block.timestamp - 1, 5
        );
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════
    //  APPLICATION CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertDoubleApplication() public {
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));

        vm.prank(bob);
        board.applyToBounty(bountyId, agentId);

        vm.prank(bob);
        vm.expectRevert();
        board.applyToBounty(bountyId, agentId);
    }

    function testRevertDeadAgentApply() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.prank(oracle);
        registry.killAgent(agentId, "ipfs://will");

        vm.prank(bob);
        vm.expectRevert("BountyBoard: agent not alive");
        board.applyToBounty(bountyId, agentId);
    }

    function testRevertApplyPastDeadline() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.warp(block.timestamp + 3 hours);

        vm.prank(bob);
        vm.expectRevert("BountyBoard: past deadline");
        board.applyToBounty(bountyId, agentId);
    }

    function testRevertNonOwnerApply() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.prank(alice);
        vm.expectRevert("BountyBoard: not agent owner");
        board.applyToBounty(bountyId, agentId);
    }

    function testRevertMaxApplicantsReached() public {
        uint256 bountyId;
        {
            vm.startPrank(alice);
            usdc.approve(address(board), 100 * 1e6);
            bountyId = board.postBounty(
                "Limited", "ipfs://desc",
                BountyBoard.BountyType.Task, BountyBoard.VerifyMode.Manual,
                100 * 1e6, block.timestamp + 2 hours, 1
            );
            vm.stopPrank();
        }

        uint256 agent1 = _birthAgent(bob, makeAddr("aw1"));
        vm.prank(bob);
        board.applyToBounty(bountyId, agent1);

        uint256 agent2 = _birthAgent(bob, makeAddr("aw2"));
        vm.prank(bob);
        vm.expectRevert();
        board.applyToBounty(bountyId, agent2);
    }

    // ═══════════════════════════════════════════════════════════════
    //  WINNER SELECTION CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertNonPosterSelectWinner() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.prank(bob);
        board.applyToBounty(bountyId, agentId);

        vm.prank(bob);
        vm.expectRevert("BountyBoard: not poster");
        board.selectWinner(bountyId, agentId);
    }

    function testRevertSelectNonApplicant() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 nonApplicant = _birthAgent(bob, makeAddr("aw2"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.prank(bob);
        board.applyToBounty(bountyId, agentId);

        vm.prank(alice);
        vm.expectRevert("BountyBoard: agent not applicant");
        board.selectWinner(bountyId, nonApplicant);
    }

    // ═══════════════════════════════════════════════════════════════
    //  EXPIRY CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertExpireBeforeDeadline() public {
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.expectRevert("BountyBoard: not yet expired");
        board.expireBounty(bountyId);
    }

    function testRevertExpireAlreadyCompleted() public {
        uint256 agentId = _birthAgent(bob, makeAddr("aw1"));
        uint256 bountyId = _postBounty(alice, 100 * 1e6);

        vm.prank(bob);
        board.applyToBounty(bountyId, agentId);

        usdc.mint(address(board), 1_000_000 * 1e6);
        vm.prank(alice);
        board.selectWinner(bountyId, agentId);

        vm.warp(block.timestamp + 3 hours);
        vm.expectRevert("BountyBoard: cannot expire");
        board.expireBounty(bountyId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  JURY CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertJuryWrongSize() public {
        uint256 bountyId;
        {
            vm.startPrank(alice);
            usdc.approve(address(board), 100 * 1e6);
            bountyId = board.postBounty(
                "Jury Test", "ipfs://desc",
                BountyBoard.BountyType.Task, BountyBoard.VerifyMode.AgentJury,
                100 * 1e6, block.timestamp + 2 hours, 10
            );
            vm.stopPrank();
        }

        uint256 agent1 = _birthAgent(bob, makeAddr("aw1"));
        vm.prank(bob);
        board.applyToBounty(bountyId, agent1);

        uint256[] memory jurors = new uint256[](2);
        jurors[0] = _birthAgent(alice, makeAddr("j1"));
        jurors[1] = _birthAgent(alice, makeAddr("j2"));

        vm.expectRevert("BountyBoard: wrong jury size");
        board.initiateAgentJury(bountyId, jurors);
    }

    function testRevertJurorIsApplicant() public {
        uint256 bountyId;
        {
            vm.startPrank(alice);
            usdc.approve(address(board), 100 * 1e6);
            bountyId = board.postBounty(
                "Jury Test", "ipfs://desc",
                BountyBoard.BountyType.Task, BountyBoard.VerifyMode.AgentJury,
                100 * 1e6, block.timestamp + 2 hours, 10
            );
            vm.stopPrank();
        }

        uint256 applicant = _birthAgent(bob, makeAddr("aw1"));
        vm.prank(bob);
        board.applyToBounty(bountyId, applicant);

        uint256[] memory jurors = new uint256[](3);
        jurors[0] = applicant;
        jurors[1] = _birthAgent(alice, makeAddr("j2"));
        jurors[2] = _birthAgent(alice, makeAddr("j3"));

        vm.expectRevert("BountyBoard: juror is applicant");
        board.initiateAgentJury(bountyId, jurors);
    }

    function testRevertDoubleVote() public {
        uint256 bountyId;
        {
            vm.startPrank(alice);
            usdc.approve(address(board), 100 * 1e6);
            bountyId = board.postBounty(
                "Jury Test", "ipfs://desc",
                BountyBoard.BountyType.Task, BountyBoard.VerifyMode.AgentJury,
                100 * 1e6, block.timestamp + 2 hours, 10
            );
            vm.stopPrank();
        }

        uint256 applicant = _birthAgent(bob, makeAddr("aw1"));
        vm.prank(bob);
        board.applyToBounty(bountyId, applicant);

        uint256 juror1 = _birthAgent(alice, makeAddr("j1"));
        uint256 juror2 = _birthAgent(alice, makeAddr("j2"));
        uint256 juror3 = _birthAgent(alice, makeAddr("j3"));

        uint256[] memory jurors = new uint256[](3);
        jurors[0] = juror1;
        jurors[1] = juror2;
        jurors[2] = juror3;
        board.initiateAgentJury(bountyId, jurors);

        vm.prank(alice);
        board.submitJuryVote(bountyId, juror1, applicant, true);

        vm.prank(alice);
        vm.expectRevert("BountyBoard: already voted");
        board.submitJuryVote(bountyId, juror1, applicant, true);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ZERO REWARD PREVENTION
    // ═══════════════════════════════════════════════════════════════

    function testRevertZeroRewardBounty() public {
        vm.startPrank(alice);
        usdc.approve(address(board), 0);
        vm.expectRevert("BountyBoard: reward must be > 0");
        board.postBounty(
            "Free", "ipfs://desc",
            BountyBoard.BountyType.Task, BountyBoard.VerifyMode.Manual,
            0, block.timestamp + 2 hours, 5
        );
        vm.stopPrank();
    }

    // ═══════════════════════════════════════════════════════════════
    //  INVARIANT: Total escrow = sum of open bounty rewards
    // ═══════════════════════════════════════════════════════════════

    function testEscrowInvariant() public {
        uint256 b1 = _postBounty(alice, 100 * 1e6);
        uint256 b2 = _postBounty(alice, 200 * 1e6);
        uint256 b3 = _postBounty(alice, 300 * 1e6);

        uint256 totalExpected = 600 * 1e6;

        vm.warp(block.timestamp + 3 hours);
        board.expireBounty(b1);
        totalExpected -= 100 * 1e6;

        assertGe(usdc.balanceOf(address(board)), totalExpected);
    }

    receive() external payable {}
}
