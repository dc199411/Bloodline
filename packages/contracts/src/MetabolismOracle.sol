// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData) external returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

interface IBloodlineRegistryMetabolism {
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

    function isAlive(uint256 agentId) external view returns (bool);
    function killAgent(uint256 agentId, string calldata lastWillURI) external;
    function getDNA(uint256 agentId) external view returns (DNA memory);
    function getAgentWallet(uint256 agentId) external view returns (address);
    function getAgentOwner(uint256 agentId) external view returns (address);
    function nextAgentId() external view returns (uint256);
}

interface IBloodlineNFTMetabolism {
    function mintDeathNFT(uint256 agentId, address to) external;
}

/// @title MetabolismOracle
/// @notice Chainlink Automation-compatible oracle that monitors agent USDC balances
///         and triggers death when funds are depleted
contract MetabolismOracle is AutomationCompatibleInterface, Ownable {
    IBloodlineRegistryMetabolism public registry;
    IBloodlineNFTMetabolism public nft;
    IERC20 public usdc;

    uint256 public constant CHECK_INTERVAL = 1 hours;
    uint256 public constant BASE_BURN_RATE = 10_000;
    uint256 public constant DANGER_RUNWAY_HOURS = 72;
    uint256 public constant MAX_CHECK_BATCH = 20;

    mapping(uint256 => bool) public registered;
    mapping(uint256 => uint256) public lastCheck;
    uint256[] public registeredAgents;

    event AgentRegistered(uint256 indexed agentId);
    event AgentChecked(uint256 indexed agentId, uint256 balance, uint256 burnRate);
    event AgentInDanger(uint256 indexed agentId, uint256 balance, uint256 hoursRemaining);
    event AgentDying(uint256 indexed agentId);
    event AgentDied(uint256 indexed agentId, string lastWillURI);

    modifier onlyRegistry() {
        require(msg.sender == address(registry) || msg.sender == owner(), "MetabolismOracle: not registry");
        _;
    }

    constructor(address _registry, address _nft, address _usdc) Ownable(msg.sender) {
        registry = IBloodlineRegistryMetabolism(_registry);
        nft = IBloodlineNFTMetabolism(_nft);
        usdc = IERC20(_usdc);
    }

    function registerAgent(uint256 agentId) external onlyRegistry {
        require(!registered[agentId], "MetabolismOracle: already registered");
        registered[agentId] = true;
        registeredAgents.push(agentId);
        lastCheck[agentId] = block.timestamp;

        emit AgentRegistered(agentId);
    }

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory needsCheck = new uint256[](MAX_CHECK_BATCH);
        uint256 count = 0;

        for (uint256 i = 0; i < registeredAgents.length && count < MAX_CHECK_BATCH; i++) {
            uint256 agentId = registeredAgents[i];
            if (registered[agentId] && registry.isAlive(agentId)) {
                if (block.timestamp >= lastCheck[agentId] + CHECK_INTERVAL) {
                    needsCheck[count] = agentId;
                    count++;
                }
            }
        }

        if (count > 0) {
            uint256[] memory toCheck = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                toCheck[i] = needsCheck[i];
            }
            upkeepNeeded = true;
            performData = abi.encode(toCheck);
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        uint256[] memory agentIds = abi.decode(performData, (uint256[]));

        for (uint256 i = 0; i < agentIds.length; i++) {
            if (registry.isAlive(agentIds[i])) {
                _checkAgent(agentIds[i]);
            }
        }
    }

    function _checkAgent(uint256 agentId) internal {
        lastCheck[agentId] = block.timestamp;

        IBloodlineRegistryMetabolism.DNA memory dna = registry.getDNA(agentId);
        uint256 burnRate = _calculateBurnRate(dna.frugality);

        address agentWallet = registry.getAgentWallet(agentId);
        uint256 balance = usdc.balanceOf(agentWallet);

        emit AgentChecked(agentId, balance, burnRate);

        if (balance == 0) {
            emit AgentDying(agentId);
        } else if (burnRate > 0) {
            uint256 hoursRemaining = (balance * 1 hours) / burnRate;
            if (hoursRemaining < DANGER_RUNWAY_HOURS) {
                emit AgentInDanger(agentId, balance, hoursRemaining);
            }
        }
    }

    uint256 public constant MIN_BURN_RATE = 1;

    function _calculateBurnRate(uint8 frugality) public pure returns (uint256) {
        uint256 rate = BASE_BURN_RATE * (256 - uint256(frugality)) / 128;
        return rate > MIN_BURN_RATE ? rate : MIN_BURN_RATE;
    }

    function finalizeKill(uint256 agentId, string calldata lastWillURI) external onlyRegistry {
        require(registry.isAlive(agentId), "MetabolismOracle: agent not alive");

        address ownerAddr = registry.getAgentOwner(agentId);
        registry.killAgent(agentId, lastWillURI);
        nft.mintDeathNFT(agentId, ownerAddr);

        emit AgentDied(agentId, lastWillURI);
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IBloodlineRegistryMetabolism(_registry);
    }

    function setNFT(address _nft) external onlyOwner {
        nft = IBloodlineNFTMetabolism(_nft);
    }

    function setUSDC(address _usdc) external onlyOwner {
        usdc = IERC20(_usdc);
    }
}
