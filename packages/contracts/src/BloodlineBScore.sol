// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title IBloodlineBScore
/// @notice Interface for external protocols to query BScores
interface IBloodlineBScore {
    struct BScoreSnapshot {
        uint256 agentId;
        uint256 composite;
        uint256 taskScore;
        uint256 profitScore;
        uint256 accuracyScore;
        uint256 arenaWinScore;
        uint256 uptimeScore;
        uint256 communityScore;
        uint256 snapshotBlock;
        uint256 snapshotAt;
    }

    function getBScore(uint256 agentId) external view returns (uint256);
    function getSnapshot(uint256 agentId) external view returns (BScoreSnapshot memory);
    function getLeaderboard(uint256 limit) external view returns (uint256[] memory agentIds, uint256[] memory scores);
}

/// @title BloodlineBScore
/// @notice Stores and manages agent BScore snapshots for the BLOODLINE ecosystem
contract BloodlineBScore is IBloodlineBScore, Ownable {
    mapping(uint256 => BScoreSnapshot) private _snapshots;
    mapping(address => bool) public authorized;

    uint256[] private _trackedAgents;
    mapping(uint256 => bool) private _isTracked;

    event SnapshotWritten(uint256 indexed agentId, uint256 composite, uint256 snapshotAt);

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "BloodlineBScore: not authorized");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function addAuthorized(address account) external onlyOwner {
        authorized[account] = true;
    }

    function removeAuthorized(address account) external onlyOwner {
        authorized[account] = false;
    }

    function writeSnapshot(uint256 agentId, BScoreSnapshot calldata snapshot) external onlyAuthorized {
        require(snapshot.agentId == agentId, "BloodlineBScore: agentId mismatch");
        _snapshots[agentId] = snapshot;

        if (!_isTracked[agentId]) {
            _trackedAgents.push(agentId);
            _isTracked[agentId] = true;
        }

        emit SnapshotWritten(agentId, snapshot.composite, snapshot.snapshotAt);
    }

    function getBScore(uint256 agentId) external view override returns (uint256) {
        return _snapshots[agentId].composite;
    }

    function getSnapshot(uint256 agentId) external view override returns (BScoreSnapshot memory) {
        return _snapshots[agentId];
    }

    function getLeaderboard(uint256 limit)
        external
        view
        override
        returns (uint256[] memory agentIds, uint256[] memory scores)
    {
        uint256 total = _trackedAgents.length;
        uint256 count = limit > total ? total : limit;

        agentIds = new uint256[](count);
        scores = new uint256[](count);

        uint256[] memory allIds = new uint256[](total);
        uint256[] memory allScores = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            allIds[i] = _trackedAgents[i];
            allScores[i] = _snapshots[allIds[i]].composite;
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 maxIdx = i;
            for (uint256 j = i + 1; j < total; j++) {
                if (allScores[j] > allScores[maxIdx]) {
                    maxIdx = j;
                }
            }
            if (maxIdx != i) {
                (allIds[i], allIds[maxIdx]) = (allIds[maxIdx], allIds[i]);
                (allScores[i], allScores[maxIdx]) = (allScores[maxIdx], allScores[i]);
            }
            agentIds[i] = allIds[i];
            scores[i] = allScores[i];
        }
    }
}
