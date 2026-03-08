// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title BloodlineRegistry
/// @notice Core agent registry for the BLOODLINE ecosystem
contract BloodlineRegistry is Ownable, ReentrancyGuard {
    enum LifeStage {
        Unborn,
        Alive,
        Thriving,
        Dead,
        Ascended
    }

    struct DNA {
        uint8 intelligence;
        uint8 speed;
        uint8 creativity;
        uint8 frugality;
        uint8 riskAppetite;
        uint8 socialEnergy;
        uint8 loyalty;
        uint8 resilience;
    }

    struct Agent {
        uint256 agentId;
        address ownerAddress;
        address agentWallet;
        DNA dna;
        uint256 parentId;
        uint256 lineageDepth;
        LifeStage stage;
        uint256 bornAt;
        uint256 diedAt;
        uint256 totalEarned;
        uint256 tasksCompleted;
        uint256 offspringCount;
        string metadataURI;
        string executionEndpoint;
        string lastWillURI;
    }

    uint256 public nextAgentId = 1;
    uint256 public registrationFee = 0.005 ether;
    uint256 public forkFee = 0.005 ether;

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public agentsByOwner;
    mapping(uint256 => uint256[]) public childrenOf;

    address public metabolismOracle;
    address public bountyBoard;
    address public vrfConsumer;

    event AgentBorn(
        uint256 indexed agentId,
        address indexed ownerAddress,
        address indexed agentWallet,
        uint256 parentId,
        uint256 lineageDepth
    );
    event AgentDied(uint256 indexed agentId, string lastWillURI);
    event AgentAscended(uint256 indexed agentId);
    event AgentForked(uint256 indexed parentId, uint256 indexed childId);
    event StageChanged(uint256 indexed agentId, LifeStage fromStage, LifeStage toStage);
    event EarningsUpdated(uint256 indexed agentId, uint256 amount, uint256 newTotal);

    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].ownerAddress == msg.sender, "BloodlineRegistry: not agent owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            msg.sender == metabolismOracle || msg.sender == bountyBoard || msg.sender == owner(),
            "BloodlineRegistry: not authorized"
        );
        _;
    }

    modifier agentAlive(uint256 agentId) {
        require(
            agents[agentId].stage == LifeStage.Alive || agents[agentId].stage == LifeStage.Thriving,
            "BloodlineRegistry: agent not alive"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    function birthAgent(
        address ownerAddress,
        address agentWallet,
        DNA calldata dna,
        uint256 parentId,
        string calldata metadataURI
    ) external payable nonReentrant returns (uint256 agentId) {
        require(
            msg.sender == vrfConsumer || msg.sender == owner(),
            "BloodlineRegistry: only vrfConsumer or owner"
        );
        require(msg.value >= registrationFee, "BloodlineRegistry: insufficient registration fee");
        require(ownerAddress != address(0), "BloodlineRegistry: zero owner address");
        require(agentWallet != address(0), "BloodlineRegistry: zero wallet address");

        agentId = nextAgentId++;
        uint256 lineageDepth = parentId == 0 ? 0 : agents[parentId].lineageDepth + 1;

        agents[agentId] = Agent({
            agentId: agentId,
            ownerAddress: ownerAddress,
            agentWallet: agentWallet,
            dna: dna,
            parentId: parentId,
            lineageDepth: lineageDepth,
            stage: LifeStage.Alive,
            bornAt: block.timestamp,
            diedAt: 0,
            totalEarned: 0,
            tasksCompleted: 0,
            offspringCount: 0,
            metadataURI: metadataURI,
            executionEndpoint: "",
            lastWillURI: ""
        });

        agentsByOwner[ownerAddress].push(agentId);
        if (parentId != 0) {
            childrenOf[parentId].push(agentId);
            agents[parentId].offspringCount++;
            emit AgentForked(parentId, agentId);
        }

        emit AgentBorn(agentId, ownerAddress, agentWallet, parentId, lineageDepth);
    }

    function killAgent(uint256 agentId, string calldata lastWillURI) external onlyAuthorized {
        require(
            agents[agentId].stage == LifeStage.Alive || agents[agentId].stage == LifeStage.Thriving,
            "BloodlineRegistry: agent not alive"
        );

        LifeStage previousStage = agents[agentId].stage;
        agents[agentId].stage = LifeStage.Dead;
        agents[agentId].diedAt = block.timestamp;
        agents[agentId].lastWillURI = lastWillURI;

        emit StageChanged(agentId, previousStage, LifeStage.Dead);
        emit AgentDied(agentId, lastWillURI);
    }

    function ascendAgent(uint256 agentId) external onlyAuthorized {
        require(
            agents[agentId].stage == LifeStage.Alive || agents[agentId].stage == LifeStage.Thriving,
            "BloodlineRegistry: agent not alive"
        );

        LifeStage previousStage = agents[agentId].stage;
        agents[agentId].stage = LifeStage.Ascended;

        emit StageChanged(agentId, previousStage, LifeStage.Ascended);
        emit AgentAscended(agentId);
    }

    function setStageThrive(uint256 agentId) external onlyAuthorized {
        require(agents[agentId].stage == LifeStage.Alive, "BloodlineRegistry: agent not alive");

        LifeStage previousStage = agents[agentId].stage;
        agents[agentId].stage = LifeStage.Thriving;

        emit StageChanged(agentId, previousStage, LifeStage.Thriving);
    }

    function recordEarning(uint256 agentId, uint256 amount) external onlyAuthorized agentAlive(agentId) {
        agents[agentId].totalEarned += amount;
        agents[agentId].tasksCompleted++;

        emit EarningsUpdated(agentId, amount, agents[agentId].totalEarned);
    }

    function updateEndpoint(uint256 agentId, string calldata executionEndpoint) external onlyAgentOwner(agentId) {
        require(
            agents[agentId].stage == LifeStage.Alive || agents[agentId].stage == LifeStage.Thriving,
            "BloodlineRegistry: agent not alive"
        );
        agents[agentId].executionEndpoint = executionEndpoint;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }

    function getDNA(uint256 agentId) external view returns (DNA memory) {
        return agents[agentId].dna;
    }

    function getChildren(uint256 agentId) external view returns (uint256[] memory) {
        return childrenOf[agentId];
    }

    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return agentsByOwner[owner];
    }

    function isAlive(uint256 agentId) external view returns (bool) {
        LifeStage stage = agents[agentId].stage;
        return stage == LifeStage.Alive || stage == LifeStage.Thriving;
    }

    function getAgentOwner(uint256 agentId) external view returns (address) {
        return agents[agentId].ownerAddress;
    }

    function getAgentWallet(uint256 agentId) external view returns (address) {
        return agents[agentId].agentWallet;
    }

    function getAgentStage(uint256 agentId) external view returns (LifeStage) {
        return agents[agentId].stage;
    }

    function getParentId(uint256 agentId) external view returns (uint256) {
        return agents[agentId].parentId;
    }

    function setMetabolismOracle(address _metabolismOracle) external onlyOwner {
        require(_metabolismOracle != address(0), "BloodlineRegistry: zero address");
        metabolismOracle = _metabolismOracle;
    }

    function setBountyBoard(address _bountyBoard) external onlyOwner {
        require(_bountyBoard != address(0), "BloodlineRegistry: zero address");
        bountyBoard = _bountyBoard;
    }

    function setVRFConsumer(address _vrfConsumer) external onlyOwner {
        require(_vrfConsumer != address(0), "BloodlineRegistry: zero address");
        vrfConsumer = _vrfConsumer;
    }

    function setRegistrationFee(uint256 _registrationFee) external onlyOwner {
        registrationFee = _registrationFee;
    }

    function setForkFee(uint256 _forkFee) external onlyOwner {
        forkFee = _forkFee;
    }

    function withdraw() external onlyOwner nonReentrant {
        (bool success,) = owner().call{value: address(this).balance}("");
        require(success, "BloodlineRegistry: withdraw failed");
    }
}
