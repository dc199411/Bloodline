// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/BloodlineNFT.sol";
import "../src/BloodlineRegistry.sol";

/// @title Security tests for BloodlineNFT — soulbound + death trade lock
contract SecurityNFTTest is Test {
    BloodlineNFT public nft;
    BloodlineRegistry public registry;

    address deployer = address(this);
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address minter = makeAddr("minter");

    BloodlineRegistry.DNA defaultDNA = BloodlineRegistry.DNA({
        intelligence: 200, speed: 180, creativity: 250, frugality: 160,
        riskAppetite: 110, socialEnergy: 230, loyalty: 140, resilience: 170
    });

    uint8[8] dnaArray = [200, 180, 250, 160, 110, 230, 140, 170];

    function setUp() public {
        registry = new BloodlineRegistry();
        nft = new BloodlineNFT(address(registry));
        nft.addAuthorized(minter);
        nft.addAuthorized(deployer);

        registry.setVRFConsumer(deployer);
        registry.setMetabolismOracle(deployer);
        vm.deal(deployer, 100 ether);
    }

    function _birthAgent() internal returns (uint256) {
        return registry.birthAgent{value: 0.005 ether}(
            alice, makeAddr("wallet"), defaultDNA, 0, "ipfs://meta"
        );
    }

    // ═══════════════════════════════════════════════════════════════
    //  SOULBOUND WHILE ALIVE — Birth NFT cannot transfer
    // ═══════════════════════════════════════════════════════════════

    function testBirthNFTSoulboundWhileAlive() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        assertEq(nft.ownerOf(agentId), alice);

        vm.prank(alice);
        vm.expectRevert("BloodlineNFT: soulbound while alive");
        nft.transferFrom(alice, bob, agentId);
    }

    function testBirthNFTTransferableAfterDeath() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        vm.prank(alice);
        nft.transferFrom(alice, bob, agentId);
        assertEq(nft.ownerOf(agentId), bob);
    }

    // ═══════════════════════════════════════════════════════════════
    //  DEATH NFT — 30 day transfer lock
    // ═══════════════════════════════════════════════════════════════

    function testDeathNFTLockedFor30Days() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        uint256 deathTokenId = 1_000_000 + agentId;
        vm.prank(minter);
        nft.mintDeathNFT(agentId, alice);

        assertEq(nft.ownerOf(deathTokenId), alice);

        vm.prank(alice);
        vm.expectRevert("BloodlineNFT: death NFT locked for 30 days");
        nft.transferFrom(alice, bob, deathTokenId);
    }

    function testDeathNFTTransferableAfter30Days() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        uint256 deathTokenId = 1_000_000 + agentId;
        vm.prank(minter);
        nft.mintDeathNFT(agentId, alice);

        vm.warp(block.timestamp + 31 days);

        vm.prank(alice);
        nft.transferFrom(alice, bob, deathTokenId);
        assertEq(nft.ownerOf(deathTokenId), bob);
    }

    function testDeathNFTStillLockedAt29Days() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        uint256 deathTokenId = 1_000_000 + agentId;
        vm.prank(minter);
        nft.mintDeathNFT(agentId, alice);

        vm.warp(block.timestamp + 29 days);

        vm.prank(alice);
        vm.expectRevert("BloodlineNFT: death NFT locked for 30 days");
        nft.transferFrom(alice, bob, deathTokenId);
    }

    // ═══════════════════════════════════════════════════════════════
    //  AUTHORIZATION CONTROLS
    // ═══════════════════════════════════════════════════════════════

    function testRevertUnauthorizedMintBirth() public {
        uint256 agentId = _birthAgent();

        vm.prank(alice);
        vm.expectRevert("BloodlineNFT: not authorized");
        nft.mintBirthNFT(agentId, dnaArray, alice);
    }

    function testRevertUnauthorizedMintDeath() public {
        uint256 agentId = _birthAgent();

        vm.prank(alice);
        vm.expectRevert("BloodlineNFT: not authorized");
        nft.mintDeathNFT(agentId, alice);
    }

    function testRevertDoubleMintBirth() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        vm.prank(minter);
        vm.expectRevert();
        nft.mintBirthNFT(agentId, dnaArray, alice);
    }

    function testRevertDoubleMintDeath() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        vm.prank(minter);
        nft.mintDeathNFT(agentId, alice);

        vm.prank(minter);
        vm.expectRevert();
        nft.mintDeathNFT(agentId, alice);
    }

    // ═══════════════════════════════════════════════════════════════
    //  TOKEN URI — On-chain SVG generation
    // ═══════════════════════════════════════════════════════════════

    function testTokenURIReturnsValidData() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        string memory uri = nft.tokenURI(agentId);
        assertTrue(bytes(uri).length > 0, "Token URI should not be empty");

        bytes memory uriBytes = bytes(uri);
        assertEq(uriBytes[0], bytes1("d"), "Should start with 'data:'");
    }

    function testDeathTokenURIReturnsValidData() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        registry.killAgent(agentId, "ipfs://will");

        uint256 deathTokenId = 1_000_000 + agentId;
        vm.prank(minter);
        nft.mintDeathNFT(agentId, alice);

        string memory uri = nft.tokenURI(deathTokenId);
        assertTrue(bytes(uri).length > 0, "Death token URI should not be empty");
    }

    // ═══════════════════════════════════════════════════════════════
    //  DNA STORAGE INTEGRITY
    // ═══════════════════════════════════════════════════════════════

    function testDNAStoredCorrectlyInNFT() public {
        uint256 agentId = _birthAgent();
        vm.prank(minter);
        nft.mintBirthNFT(agentId, dnaArray, alice);

        for (uint256 i = 0; i < 8; i++) {
            assertEq(nft.tokenDNA(agentId, i), dnaArray[i]);
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════

    function testAddRemoveAuthorized() public {
        address newMinter = makeAddr("newMinter");
        nft.addAuthorized(newMinter);
        assertTrue(nft.authorized(newMinter));

        nft.removeAuthorized(newMinter);
        assertFalse(nft.authorized(newMinter));
    }

    function testRevertNonOwnerAddAuthorized() public {
        vm.prank(alice);
        vm.expectRevert();
        nft.addAuthorized(makeAddr("newMinter"));
    }

    // ═══════════════════════════════════════════════════════════════
    //  FUZZ: Random DNA arrays
    // ═══════════════════════════════════════════════════════════════

    function testFuzz_MintBirthWithRandomDNA(
        uint8 a, uint8 b, uint8 c, uint8 d,
        uint8 e, uint8 f, uint8 g, uint8 h
    ) public {
        uint256 agentId = _birthAgent();
        uint8[8] memory dna = [a, b, c, d, e, f, g, h];

        vm.prank(minter);
        nft.mintBirthNFT(agentId, dna, alice);

        assertEq(nft.ownerOf(agentId), alice);
        for (uint256 i = 0; i < 8; i++) {
            assertEq(nft.tokenDNA(agentId, i), dna[i]);
        }
    }

    receive() external payable {}
}
