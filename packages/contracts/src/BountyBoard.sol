// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBloodlineRegistryBounty {
    function isAlive(uint256 agentId) external view returns (bool);
    function recordEarning(uint256 agentId, uint256 amount) external;
    function getAgentOwner(uint256 agentId) external view returns (address);
    function getAgentWallet(uint256 agentId) external view returns (address);
}

interface IRoyaltyRouterBounty {
    function routeEarning(uint256 agentId, uint256 amount) external;
}

/// @title BountyBoard
/// @notice Job marketplace for BLOODLINE agents with escrow, auto-grading, and jury verification
contract BountyBoard is Ownable, ReentrancyGuard {
    enum BountyType { Task, Quest, Arena }
    enum BountyStatus { Open, InProgress, UnderReview, Completed, Expired, Disputed }
    enum VerifyMode { AutoGrader, AgentJury, Manual }

    struct Bounty {
        uint256 bountyId;
        address poster;
        string title;
        string descriptionURI;
        BountyType bountyType;
        BountyStatus status;
        VerifyMode verifyMode;
        uint256 reward;
        uint256 deadline;
        uint256 maxApplicants;
        uint256[] applicants;
        uint256 winnerId;
        uint256 createdAt;
    }

    struct JuryVote {
        uint256 jurorAgentId;
        uint256 candidateAgentId;
        bool approved;
    }

    IERC20 public usdc;
    IBloodlineRegistryBounty public registry;
    IRoyaltyRouterBounty public royaltyRouter;

    uint256 public nextBountyId = 1;
    uint256 public constant JURY_SIZE = 3;
    uint256 public constant JURY_QUORUM = 2;

    mapping(uint256 => Bounty) public bounties;
    mapping(uint256 => mapping(uint256 => bool)) public hasApplied;
    mapping(uint256 => JuryVote[]) public juryVotes;
    mapping(uint256 => uint256[]) public juryPanel;
    mapping(uint256 => mapping(uint256 => bool)) public jurorHasVoted;

    event BountyPosted(uint256 indexed bountyId, address indexed poster, uint256 reward, BountyType bountyType);
    event BountyApplied(uint256 indexed bountyId, uint256 indexed agentId);
    event WinnerSelected(uint256 indexed bountyId, uint256 indexed agentId, uint256 reward);
    event BountyExpired(uint256 indexed bountyId);
    event BountyDisputed(uint256 indexed bountyId);
    event AutoGraderResult(uint256 indexed bountyId, uint256 indexed agentId, bool passed);
    event JuryInitiated(uint256 indexed bountyId, uint256[] jurors);
    event JuryVoteSubmitted(uint256 indexed bountyId, uint256 indexed jurorAgentId, uint256 candidateAgentId, bool approved);

    constructor(address _usdc, address _registry, address _royaltyRouter) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IBloodlineRegistryBounty(_registry);
        royaltyRouter = IRoyaltyRouterBounty(_royaltyRouter);
    }

    function postBounty(
        string calldata title,
        string calldata descriptionURI,
        BountyType bountyType,
        VerifyMode verifyMode,
        uint256 reward,
        uint256 deadline,
        uint256 maxApplicants
    ) external nonReentrant returns (uint256 bountyId) {
        require(reward > 0, "BountyBoard: reward must be > 0");
        require(deadline > block.timestamp + 1 hours, "BountyBoard: deadline must be at least 1 hour ahead");
        require(maxApplicants > 0, "BountyBoard: need at least 1 applicant slot");

        require(usdc.transferFrom(msg.sender, address(this), reward), "BountyBoard: escrow transfer failed");

        bountyId = nextBountyId++;
        Bounty storage b = bounties[bountyId];
        b.bountyId = bountyId;
        b.poster = msg.sender;
        b.title = title;
        b.descriptionURI = descriptionURI;
        b.bountyType = bountyType;
        b.status = BountyStatus.Open;
        b.verifyMode = verifyMode;
        b.reward = reward;
        b.deadline = deadline;
        b.maxApplicants = maxApplicants;
        b.createdAt = block.timestamp;

        emit BountyPosted(bountyId, msg.sender, reward, bountyType);
    }

    function applyToBounty(uint256 bountyId, uint256 agentId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.Open, "BountyBoard: bounty not open");
        require(block.timestamp < b.deadline, "BountyBoard: past deadline");
        require(!hasApplied[bountyId][agentId], "BountyBoard: already applied");
        require(b.applicants.length < b.maxApplicants, "BountyBoard: max applicants reached");
        require(registry.isAlive(agentId), "BountyBoard: agent not alive");

        require(registry.getAgentOwner(agentId) == msg.sender, "BountyBoard: not agent owner");

        b.applicants.push(agentId);
        hasApplied[bountyId][agentId] = true;

        if (b.applicants.length == 1) {
            b.status = BountyStatus.InProgress;
        }

        emit BountyApplied(bountyId, agentId);
    }

    function selectWinner(uint256 bountyId, uint256 agentId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(msg.sender == b.poster || msg.sender == owner(), "BountyBoard: not poster");
        require(
            b.status == BountyStatus.InProgress || b.status == BountyStatus.UnderReview,
            "BountyBoard: invalid status"
        );
        require(hasApplied[bountyId][agentId], "BountyBoard: agent not applicant");
        require(registry.isAlive(agentId), "BountyBoard: agent not alive");

        b.status = BountyStatus.Completed;
        b.winnerId = agentId;

        require(usdc.approve(address(royaltyRouter), b.reward), "BountyBoard: approve failed");
        royaltyRouter.routeEarning(agentId, b.reward);

        registry.recordEarning(agentId, b.reward);

        emit WinnerSelected(bountyId, agentId, b.reward);
    }

    function expireBounty(uint256 bountyId) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(block.timestamp >= b.deadline, "BountyBoard: not yet expired");
        require(
            b.status == BountyStatus.Open || b.status == BountyStatus.InProgress,
            "BountyBoard: cannot expire"
        );

        b.status = BountyStatus.Expired;
        require(usdc.transfer(b.poster, b.reward), "BountyBoard: refund failed");

        emit BountyExpired(bountyId);
    }

    function submitAutoGraderResult(
        uint256 bountyId,
        uint256 agentId,
        bool passed
    ) external {
        require(msg.sender == owner(), "BountyBoard: only owner");
        Bounty storage b = bounties[bountyId];
        require(b.verifyMode == VerifyMode.AutoGrader, "BountyBoard: not auto-grader mode");
        require(
            b.status == BountyStatus.InProgress || b.status == BountyStatus.UnderReview,
            "BountyBoard: invalid status"
        );
        require(hasApplied[bountyId][agentId], "BountyBoard: agent not applicant");

        b.status = BountyStatus.UnderReview;

        emit AutoGraderResult(bountyId, agentId, passed);
    }

    function initiateAgentJury(uint256 bountyId, uint256[] calldata jurorAgentIds) external {
        require(msg.sender == owner(), "BountyBoard: only owner");
        Bounty storage b = bounties[bountyId];
        require(b.verifyMode == VerifyMode.AgentJury, "BountyBoard: not jury mode");
        require(
            b.status == BountyStatus.InProgress || b.status == BountyStatus.UnderReview,
            "BountyBoard: invalid status"
        );
        require(jurorAgentIds.length == JURY_SIZE, "BountyBoard: wrong jury size");

        b.status = BountyStatus.UnderReview;
        delete juryPanel[bountyId];
        for (uint256 i = 0; i < jurorAgentIds.length; i++) {
            require(registry.isAlive(jurorAgentIds[i]), "BountyBoard: juror not alive");
            require(!hasApplied[bountyId][jurorAgentIds[i]], "BountyBoard: juror is applicant");
            juryPanel[bountyId].push(jurorAgentIds[i]);
        }

        emit JuryInitiated(bountyId, jurorAgentIds);
    }

    function submitJuryVote(
        uint256 bountyId,
        uint256 jurorAgentId,
        uint256 candidateAgentId,
        bool approved
    ) external nonReentrant {
        Bounty storage b = bounties[bountyId];
        require(b.status == BountyStatus.UnderReview, "BountyBoard: not under review");
        require(hasApplied[bountyId][candidateAgentId], "BountyBoard: candidate not applicant");

        require(registry.getAgentOwner(jurorAgentId) == msg.sender, "BountyBoard: not juror owner");

        bool isJuror = false;
        for (uint256 i = 0; i < juryPanel[bountyId].length; i++) {
            if (juryPanel[bountyId][i] == jurorAgentId) {
                isJuror = true;
                break;
            }
        }
        require(isJuror, "BountyBoard: not on jury panel");
        require(!jurorHasVoted[bountyId][jurorAgentId], "BountyBoard: already voted");

        jurorHasVoted[bountyId][jurorAgentId] = true;
        juryVotes[bountyId].push(JuryVote({
            jurorAgentId: jurorAgentId,
            candidateAgentId: candidateAgentId,
            approved: approved
        }));

        emit JuryVoteSubmitted(bountyId, jurorAgentId, candidateAgentId, approved);
    }

    function getBounty(uint256 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getApplicants(uint256 bountyId) external view returns (uint256[] memory) {
        return bounties[bountyId].applicants;
    }

    function getJuryPanel(uint256 bountyId) external view returns (uint256[] memory) {
        return juryPanel[bountyId];
    }

    function getJuryVotes(uint256 bountyId) external view returns (JuryVote[] memory) {
        return juryVotes[bountyId];
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IBloodlineRegistryBounty(_registry);
    }

    function setRoyaltyRouter(address _royaltyRouter) external onlyOwner {
        royaltyRouter = IRoyaltyRouterBounty(_royaltyRouter);
    }

    function setUSDC(address _usdc) external onlyOwner {
        usdc = IERC20(_usdc);
    }
}
