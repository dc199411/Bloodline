// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBloodlineRegistryRoyalty {
    enum LifeStage { Unborn, Alive, Thriving, Dead, Ascended }

    function getAgentWallet(uint256 agentId) external view returns (address);
    function getAgentOwner(uint256 agentId) external view returns (address);
    function getParentId(uint256 agentId) external view returns (uint256);
    function getAgentStage(uint256 agentId) external view returns (LifeStage);
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
        require(_usdc != address(0), "RoyaltyRouter: zero usdc address");
        require(_registry != address(0), "RoyaltyRouter: zero registry address");
        require(_protocolTreasury != address(0), "RoyaltyRouter: zero treasury address");
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

        address agentWallet = registry.getAgentWallet(agentId);

        uint256 protocolFee = (amount * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
        uint256 parentShare;
        uint256 grandparentShare;
        uint256 greatGrandparentShare;
        uint256 remainder = amount;

        if (protocolFee > 0) {
            require(usdc.transfer(protocolTreasury, protocolFee), "RoyaltyRouter: protocol fee failed");
            remainder -= protocolFee;
        }

        uint256 parentId = registry.getParentId(agentId);
        if (parentId != 0) {
            parentShare = (amount * CHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
            if (_payRoyalty(agentId, parentId, parentShare)) {
                remainder -= parentShare;
            } else {
                parentShare = 0;
            }

            uint256 grandparentId = registry.getParentId(parentId);
            if (grandparentId != 0) {
                grandparentShare = (amount * GRANDCHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
                if (_payRoyalty(agentId, grandparentId, grandparentShare)) {
                    remainder -= grandparentShare;
                } else {
                    grandparentShare = 0;
                }

                uint256 greatGrandparentId = registry.getParentId(grandparentId);
                if (greatGrandparentId != 0) {
                    greatGrandparentShare = (amount * GREAT_GRANDCHILD_ROYALTY_BPS) / BPS_DENOMINATOR;
                    if (_payRoyalty(agentId, greatGrandparentId, greatGrandparentShare)) {
                        remainder -= greatGrandparentShare;
                    } else {
                        greatGrandparentShare = 0;
                    }
                }
            }
        }

        if (remainder > 0) {
            require(
                usdc.transfer(agentWallet, remainder),
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
        IBloodlineRegistryRoyalty.LifeStage stage = registry.getAgentStage(deadAgentId);
        require(
            stage == IBloodlineRegistryRoyalty.LifeStage.Dead,
            "RoyaltyRouter: agent not dead"
        );

        address deadWallet = registry.getAgentWallet(deadAgentId);
        uint256 balance = usdc.balanceOf(deadWallet);
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
                usdc.transferFrom(deadWallet, protocolTreasury, balance),
                "RoyaltyRouter: treasury transfer failed"
            );
            emit LegacyDistributed(deadAgentId, balance, 0);
            return;
        }

        uint256 share = balance / livingCount;
        uint256 distributed;

        for (uint256 i = 0; i < children.length; i++) {
            if (registry.isAlive(children[i])) {
                address childWallet = registry.getAgentWallet(children[i]);
                require(
                    usdc.transferFrom(deadWallet, childWallet, share),
                    "RoyaltyRouter: legacy transfer failed"
                );
                distributed++;
            }
        }

        emit LegacyDistributed(deadAgentId, balance, distributed);
    }

    function _payRoyalty(uint256 fromAgentId, uint256 toAgentId, uint256 amount) internal returns (bool paid) {
        if (amount == 0) return false;

        if (!registry.isAlive(toAgentId)) return false;

        address ancestorWallet = registry.getAgentWallet(toAgentId);
        require(
            usdc.transfer(ancestorWallet, amount),
            "RoyaltyRouter: royalty transfer failed"
        );

        emit RoyaltyPaid(fromAgentId, toAgentId, ancestorWallet, amount);
        return true;
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
