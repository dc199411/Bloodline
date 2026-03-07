// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBloodlineRegistryRoyalty {
    enum LifeStage { Unborn, Alive, Thriving, Dead, Ascended }

    struct Agent {
        uint256 agentId;
        address ownerAddress;
        address agentWallet;
        uint256 parentId;
        LifeStage stage;
    }

    function getAgent(uint256 agentId) external view returns (Agent memory);
    function getChildren(uint256 agentId) external view returns (uint256[] memory);
    function isAlive(uint256 agentId) external view returns (bool);
}

/// @title RoyaltyRouter
/// @notice Routes USDC royalties through agent lineage (parent, grandparent, great-grandparent)
///         and distributes legacy pools from dead agents to living children
contract RoyaltyRouter is Ownable, ReentrancyGuard {
    uint256 public constant CHILD_ROYALTY_BPS = 1000;
    uint256 public constant GRANDCHILD_ROYALTY_BPS = 300;
    uint256 public constant GREAT_GRANDCHILD_ROYALTY_BPS = 100;
    uint256 public constant PROTOCOL_FEE_BPS = 20;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    IERC20 public usdc;
    IBloodlineRegistryRoyalty public registry;
    address public protocolTreasury;

    mapping(address => bool) public authorized;

    event RoyaltyRouted(
        uint256 indexed agentId,
        uint256 totalEarning,
        uint256 parentShare,
        uint256 grandparentShare,
        uint256 greatGrandparentShare,
        uint256 protocolFee
    );
    event LegacyDistributed(uint256 indexed deadAgentId, uint256 totalAmount, uint256 recipientCount);
    event RoyaltyPaid(uint256 indexed fromAgentId, uint256 indexed toAgentId, address toWallet, uint256 amount);

    modifier onlyAuthorized() {
        require(authorized[msg.sender] || msg.sender == owner(), "RoyaltyRouter: not authorized");
        _;
    }

    constructor(address _usdc, address _registry, address _protocolTreasury) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        registry = IBloodlineRegistryRoyalty(_registry);
        protocolTreasury = _protocolTreasury;
    }

    function addAuthorized(address account) external onlyOwner {
        authorized[account] = true;
    }

    function removeAuthorized(address account) external onlyOwner {
        authorized[account] = false;
    }

    function routeEarning(uint256 agentId, uint256 amount) external nonReentrant onlyAuthorized {
        require(amount > 0, "RoyaltyRouter: zero amount");

        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "RoyaltyRouter: transfer failed"
        );

        IBloodlineRegistryRoyalty.Agent memory agent = registry.getAgent(agentId);

        uint256 protocolFee = (amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 parentShare;
        uint256 grandparentShare;
        uint256 greatGrandparentShare;
        uint256 remainder = amount;

        if (protocolFee > 0) {
            require(usdc.transfer(protocolTreasury, protocolFee), "RoyaltyRouter: protocol fee failed");
            remainder -= protocolFee;
        }

        uint256 parentId = agent.parentId;
        if (parentId != 0) {
            parentShare = (amount * CHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
            _payRoyalty(agentId, parentId, parentShare);
            remainder -= parentShare;

            IBloodlineRegistryRoyalty.Agent memory parent = registry.getAgent(parentId);
            uint256 grandparentId = parent.parentId;
            if (grandparentId != 0) {
                grandparentShare = (amount * GRANDCHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
                _payRoyalty(agentId, grandparentId, grandparentShare);
                remainder -= grandparentShare;

                IBloodlineRegistryRoyalty.Agent memory grandparent = registry.getAgent(grandparentId);
                uint256 greatGrandparentId = grandparent.parentId;
                if (greatGrandparentId != 0) {
                    greatGrandparentShare = (amount * GREAT_GRANDCHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
                    _payRoyalty(agentId, greatGrandparentId, greatGrandparentShare);
                    remainder -= greatGrandparentShare;
                }
            }
        }

        if (remainder > 0) {
            require(
                usdc.transfer(agent.agentWallet, remainder),
                "RoyaltyRouter: agent payout failed"
            );
        }

        emit RoyaltyRouted(
            agentId,
            amount,
            parentShare,
            grandparentShare,
            greatGrandparentShare,
            protocolFee
        );
    }

    function distributeLegacyPool(uint256 deadAgentId) external nonReentrant onlyAuthorized {
        IBloodlineRegistryRoyalty.Agent memory agent = registry.getAgent(deadAgentId);
        require(
            agent.stage == IBloodlineRegistryRoyalty.LifeStage.Dead,
            "RoyaltyRouter: agent not dead"
        );

        uint256 balance = usdc.balanceOf(agent.agentWallet);
        require(balance > 0, "RoyaltyRouter: no legacy balance");

        uint256[] memory children = registry.getChildren(deadAgentId);

        uint256 livingCount;
        for (uint256 i = 0; i < children.length; i++) {
            if (registry.isAlive(children[i])) {
                livingCount++;
            }
        }

        if (livingCount == 0) {
            require(
                usdc.transferFrom(agent.agentWallet, protocolTreasury, balance),
                "RoyaltyRouter: treasury transfer failed"
            );
            emit LegacyDistributed(deadAgentId, balance, 0);
            return;
        }

        uint256 share = balance / livingCount;
        uint256 distributed;

        for (uint256 i = 0; i < children.length; i++) {
            if (registry.isAlive(children[i])) {
                IBloodlineRegistryRoyalty.Agent memory child = registry.getAgent(children[i]);
                require(
                    usdc.transferFrom(agent.agentWallet, child.agentWallet, share),
                    "RoyaltyRouter: legacy transfer failed"
                );
                distributed++;
            }
        }

        emit LegacyDistributed(deadAgentId, balance, distributed);
    }

    function _payRoyalty(uint256 fromAgentId, uint256 toAgentId, uint256 amount) internal {
        if (amount == 0) return;

        IBloodlineRegistryRoyalty.Agent memory ancestor = registry.getAgent(toAgentId);
        require(
            usdc.transfer(ancestor.agentWallet, amount),
            "RoyaltyRouter: royalty transfer failed"
        );

        emit RoyaltyPaid(fromAgentId, toAgentId, ancestor.agentWallet, amount);
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IBloodlineRegistryRoyalty(_registry);
    }

    function setProtocolTreasury(address _protocolTreasury) external onlyOwner {
        protocolTreasury = _protocolTreasury;
    }

    function setUSDC(address _usdc) external onlyOwner {
        usdc = IERC20(_usdc);
    }
}
