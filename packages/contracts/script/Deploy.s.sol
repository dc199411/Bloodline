// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";

import "../src/BloodlineRegistry.sol";
import "../src/BloodlineNFT.sol";
import "../src/BloodlineBScore.sol";
import "../src/VRFConsumer.sol";
import "../src/MetabolismOracle.sol";
import "../src/BountyBoard.sol";
import "../src/RoyaltyRouter.sol";

contract Deploy is Script {
    function run() external {
        address vrfCoordinator = vm.envAddress("VRF_COORDINATOR");
        uint256 vrfSubscriptionId = vm.envUint("VRF_SUBSCRIPTION_ID");
        bytes32 vrfKeyHash = vm.envBytes32("VRF_KEY_HASH");
        address usdc = vm.envAddress("USDC_ADDRESS");
        address protocolTreasury = vm.envAddress("PROTOCOL_TREASURY");

        vm.startBroadcast();

        BloodlineRegistry registry = new BloodlineRegistry();
        BloodlineBScore bScore = new BloodlineBScore();
        BloodlineNFT nft = new BloodlineNFT(address(registry));

        VRFConsumer vrfConsumer = new VRFConsumer(
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash,
            address(registry),
            address(nft)
        );

        MetabolismOracle metabolismOracle = new MetabolismOracle(
            address(registry),
            address(nft),
            usdc
        );

        RoyaltyRouter royaltyRouter = new RoyaltyRouter(
            usdc,
            address(registry),
            protocolTreasury
        );

        BountyBoard bountyBoard = new BountyBoard(
            usdc,
            address(registry),
            address(royaltyRouter)
        );

        // Post-deploy: authorize peripheral contracts on the registry
        registry.setVRFConsumer(address(vrfConsumer));
        registry.setMetabolismOracle(address(metabolismOracle));
        registry.setBountyBoard(address(bountyBoard));

        // Authorize VRFConsumer + MetabolismOracle on the NFT contract
        nft.addAuthorized(address(vrfConsumer));
        nft.addAuthorized(address(metabolismOracle));

        // Authorize MetabolismOracle on the BScore contract (for snapshots)
        bScore.addAuthorized(address(metabolismOracle));

        // Authorize BountyBoard on the RoyaltyRouter
        royaltyRouter.addAuthorized(address(bountyBoard));

        vm.stopBroadcast();

        console.log("BloodlineRegistry :", address(registry));
        console.log("BloodlineBScore   :", address(bScore));
        console.log("BloodlineNFT      :", address(nft));
        console.log("VRFConsumer       :", address(vrfConsumer));
        console.log("MetabolismOracle  :", address(metabolismOracle));
        console.log("RoyaltyRouter     :", address(royaltyRouter));
        console.log("BountyBoard       :", address(bountyBoard));
    }
}
