// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BloodlineBScore.sol";

/// @title Security tests for BloodlineBScore
contract SecurityBScoreTest is Test {
    BloodlineBScore public bscore;

    address deployer = address(this);
    address alice = makeAddr("alice");
    address authorized = makeAddr("authorized");

    function setUp() public {
        bscore = new BloodlineBScore();
        bscore.addAuthorized(authorized);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ACCESS CONTROL
    // ═══════════════════════════════════════════════════════════════

    function testRevertUnauthorizedWrite() public {
        IBloodlineBScore.BScoreSnapshot memory snap = IBloodlineBScore.BScoreSnapshot({
            agentId: 1,
            composite: 850,
            taskScore: 900,
            profitScore: 800,
            accuracyScore: 750,
            arenaWinScore: 700,
            uptimeScore: 950,
            communityScore: 600,
            snapshotBlock: 1000,
            snapshotAt: block.timestamp
        });

        vm.prank(alice);
        vm.expectRevert("BloodlineBScore: not authorized");
        bscore.writeSnapshot(1, snap);
    }

    function testAuthorizedCanWrite() public {
        IBloodlineBScore.BScoreSnapshot memory snap = IBloodlineBScore.BScoreSnapshot({
            agentId: 1,
            composite: 850,
            taskScore: 900,
            profitScore: 800,
            accuracyScore: 750,
            arenaWinScore: 700,
            uptimeScore: 950,
            communityScore: 600,
            snapshotBlock: 1000,
            snapshotAt: block.timestamp
        });

        vm.prank(authorized);
        bscore.writeSnapshot(1, snap);

        assertEq(bscore.getBScore(1), 850);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AGENT ID MISMATCH PREVENTION
    // ═══════════════════════════════════════════════════════════════

    function testRevertAgentIdMismatch() public {
        IBloodlineBScore.BScoreSnapshot memory snap = IBloodlineBScore.BScoreSnapshot({
            agentId: 2,
            composite: 850,
            taskScore: 900,
            profitScore: 800,
            accuracyScore: 750,
            arenaWinScore: 700,
            uptimeScore: 950,
            communityScore: 600,
            snapshotBlock: 1000,
            snapshotAt: block.timestamp
        });

        vm.prank(authorized);
        vm.expectRevert("BloodlineBScore: agentId mismatch");
        bscore.writeSnapshot(1, snap);
    }

    // ═══════════════════════════════════════════════════════════════
    //  SNAPSHOT OVERWRITING
    // ═══════════════════════════════════════════════════════════════

    function testSnapshotOverwrite() public {
        IBloodlineBScore.BScoreSnapshot memory snap1 = IBloodlineBScore.BScoreSnapshot({
            agentId: 1, composite: 500, taskScore: 500, profitScore: 500,
            accuracyScore: 500, arenaWinScore: 500, uptimeScore: 500,
            communityScore: 500, snapshotBlock: 100, snapshotAt: block.timestamp
        });

        vm.prank(authorized);
        bscore.writeSnapshot(1, snap1);
        assertEq(bscore.getBScore(1), 500);

        IBloodlineBScore.BScoreSnapshot memory snap2 = IBloodlineBScore.BScoreSnapshot({
            agentId: 1, composite: 900, taskScore: 900, profitScore: 900,
            accuracyScore: 900, arenaWinScore: 900, uptimeScore: 900,
            communityScore: 900, snapshotBlock: 200, snapshotAt: block.timestamp
        });

        vm.prank(authorized);
        bscore.writeSnapshot(1, snap2);
        assertEq(bscore.getBScore(1), 900);
    }

    // ═══════════════════════════════════════════════════════════════
    //  LEADERBOARD INTEGRITY
    // ═══════════════════════════════════════════════════════════════

    function testLeaderboardSorted() public {
        _writeScore(1, 500);
        _writeScore(2, 900);
        _writeScore(3, 700);
        _writeScore(4, 300);
        _writeScore(5, 800);

        (uint256[] memory ids, uint256[] memory scores) = bscore.getLeaderboard(5);

        assertEq(ids.length, 5);
        assertEq(ids[0], 2);
        assertEq(scores[0], 900);
        assertEq(ids[1], 5);
        assertEq(scores[1], 800);
        assertEq(ids[2], 3);
        assertEq(scores[2], 700);
    }

    function testLeaderboardLimitRespected() public {
        for (uint256 i = 1; i <= 20; i++) {
            _writeScore(i, i * 100);
        }

        (uint256[] memory ids,) = bscore.getLeaderboard(5);
        assertEq(ids.length, 5);
    }

    function testLeaderboardLimitExceedsTotal() public {
        _writeScore(1, 500);
        _writeScore(2, 900);

        (uint256[] memory ids,) = bscore.getLeaderboard(100);
        assertEq(ids.length, 2);
    }

    function testLeaderboardEmpty() public {
        (uint256[] memory ids, uint256[] memory scores) = bscore.getLeaderboard(10);
        assertEq(ids.length, 0);
        assertEq(scores.length, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ZERO SCORE HANDLING
    // ═══════════════════════════════════════════════════════════════

    function testGetBScoreForUnknownAgent() public view {
        assertEq(bscore.getBScore(9999), 0);
    }

    function testGetSnapshotForUnknownAgent() public view {
        IBloodlineBScore.BScoreSnapshot memory snap = bscore.getSnapshot(9999);
        assertEq(snap.composite, 0);
        assertEq(snap.agentId, 0);
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testAddRemoveAuthorized() public {
        address newAuth = makeAddr("newAuth");
        bscore.addAuthorized(newAuth);
        assertTrue(bscore.authorized(newAuth));

        bscore.removeAuthorized(newAuth);
        assertFalse(bscore.authorized(newAuth));
    }

    function testRevertNonOwnerAuth() public {
        vm.prank(alice);
        vm.expectRevert();
        bscore.addAuthorized(makeAddr("evil"));
    }

    // ═══════════════════════════════════════════════════════════════
    //  FUZZ: Score values
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_WriteAndReadScore(uint256 agentId, uint256 score) public {
        agentId = bound(agentId, 1, type(uint128).max);
        score = bound(score, 0, type(uint128).max);

        IBloodlineBScore.BScoreSnapshot memory snap = IBloodlineBScore.BScoreSnapshot({
            agentId: agentId, composite: score, taskScore: score, profitScore: score,
            accuracyScore: score, arenaWinScore: score, uptimeScore: score,
            communityScore: score, snapshotBlock: block.number, snapshotAt: block.timestamp
        });

        vm.prank(authorized);
        bscore.writeSnapshot(agentId, snap);

        assertEq(bscore.getBScore(agentId), score);
    }

    // ═══════════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════════

    function _writeScore(uint256 agentId, uint256 score) internal {
        IBloodlineBScore.BScoreSnapshot memory snap = IBloodlineBScore.BScoreSnapshot({
            agentId: agentId, composite: score, taskScore: score, profitScore: score,
            accuracyScore: score, arenaWinScore: score, uptimeScore: score,
            communityScore: score, snapshotBlock: block.number, snapshotAt: block.timestamp
        });
        vm.prank(authorized);
        bscore.writeSnapshot(agentId, snap);
    }
}
