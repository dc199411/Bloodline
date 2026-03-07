// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IBloodlineRegistryNFT {
    function isAlive(uint256 agentId) external view returns (bool);
}

/// @title BloodlineNFT
/// @notice On-chain generative NFTs for agent birth and death events
contract BloodlineNFT is ERC721URIStorage, Ownable {
    using Strings for uint256;
    using Strings for uint8;

    uint256 public constant DEATH_TOKEN_OFFSET = 1_000_000;
    uint256 public constant DEATH_TRADE_DELAY = 30 days;

    IBloodlineRegistryNFT public registry;

    mapping(address => bool) public authorized;
    mapping(uint256 => uint8[8]) public tokenDNA;
    mapping(uint256 => bool) public isBirthToken;
    mapping(uint256 => bool) public isDeathToken;
    mapping(uint256 => uint256) public deathTimestamp;

    event BirthNFTMinted(uint256 indexed agentId, address indexed to);
    event DeathNFTMinted(uint256 indexed agentId, address indexed to);

    modifier onlyAuthorized() {
        require(authorized[msg.sender], "BloodlineNFT: not authorized");
        _;
    }

    constructor(address _registry)
        ERC721("Bloodline", "BLDN")
        Ownable(msg.sender)
    {
        registry = IBloodlineRegistryNFT(_registry);
    }

    function addAuthorized(address account) external onlyOwner {
        authorized[account] = true;
    }

    function removeAuthorized(address account) external onlyOwner {
        authorized[account] = false;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IBloodlineRegistryNFT(_registry);
    }

    function mintBirthNFT(uint256 agentId, uint8[8] calldata dna, address to) external onlyAuthorized {
        uint256 tokenId = agentId;
        _mint(to, tokenId);
        tokenDNA[tokenId] = dna;
        isBirthToken[tokenId] = true;

        string memory svg = _generateBirthSVG(dna);
        string memory json = _buildTokenJSON(agentId, "Birth", svg, dna);
        _setTokenURI(tokenId, json);

        emit BirthNFTMinted(agentId, to);
    }

    function mintDeathNFT(uint256 agentId, address to) external onlyAuthorized {
        uint256 tokenId = DEATH_TOKEN_OFFSET + agentId;
        _mint(to, tokenId);
        isDeathToken[tokenId] = true;
        deathTimestamp[tokenId] = block.timestamp;

        uint8[8] memory dna = tokenDNA[agentId];
        string memory svg = _generateDeathSVG(dna);
        string memory json = _buildTokenJSON(agentId, "Death", svg, dna);
        _setTokenURI(tokenId, json);

        emit DeathNFTMinted(agentId, to);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);

        if (from != address(0) && to != address(0)) {
            if (isBirthToken[tokenId]) {
                uint256 agentId = tokenId;
                require(!registry.isAlive(agentId), "BloodlineNFT: soulbound while alive");
            }

            if (isDeathToken[tokenId]) {
                require(
                    block.timestamp >= deathTimestamp[tokenId] + DEATH_TRADE_DELAY,
                    "BloodlineNFT: death NFT locked for 30 days"
                );
            }
        }

        return super._update(to, tokenId, auth);
    }

    function _buildTokenJSON(
        uint256 agentId,
        string memory nftType,
        string memory svgBase64,
        uint8[8] memory dna
    ) internal pure returns (string memory) {
        string memory json = string(
            abi.encodePacked(
                '{"name":"Bloodline Agent #', agentId.toString(),
                ' - ', nftType,
                '","description":"On-chain Bloodline ', nftType, ' NFT"',
                ',"image":"data:image/svg+xml;base64,', svgBase64, '"',
                ',"attributes":[',
                _dnaAttributes(dna),
                ']}'
            )
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

    function _dnaAttributes(uint8[8] memory dna) internal pure returns (string memory) {
        string[8] memory names = [
            "Intelligence", "Speed", "Creativity", "Frugality",
            "Risk Appetite", "Social Energy", "Loyalty", "Resilience"
        ];
        bytes memory attrs;
        for (uint256 i = 0; i < 8; i++) {
            if (i > 0) attrs = abi.encodePacked(attrs, ",");
            attrs = abi.encodePacked(
                attrs,
                '{"trait_type":"', names[i], '","value":', uint256(dna[i]).toString(), '}'
            );
        }
        return string(attrs);
    }

    function _generateBirthSVG(uint8[8] memory dna) internal pure returns (string memory) {
        return _generateSVG(dna, false);
    }

    function _generateDeathSVG(uint8[8] memory dna) internal pure returns (string memory) {
        return _generateSVG(dna, true);
    }

    function _generateSVG(uint8[8] memory dna, bool isDeath) internal pure returns (string memory) {
        string memory bg = isDeath ? "#1a1a2e" : "#0f0f23";
        string memory accentOpacity = isDeath ? "0.3" : "0.8";

        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">',
            '<rect width="400" height="400" fill="', bg, '"/>',
            _generateTraitCircles(dna, accentOpacity),
            _generateCenterElement(dna, isDeath),
            '</svg>'
        );

        return Base64.encode(svg);
    }

    function _generateTraitCircles(uint8[8] memory dna, string memory opacity) internal pure returns (string memory) {
        bytes memory circles;
        for (uint256 i = 0; i < 8; i++) {
            uint256 cx = 60 + (i % 4) * 93;
            uint256 cy = i < 4 ? uint256(120) : uint256(280);
            uint256 r = 10 + uint256(dna[i]) / 8;
            circles = abi.encodePacked(
                circles,
                '<circle cx="', cx.toString(),
                '" cy="', cy.toString(),
                '" r="', r.toString(),
                '" fill="rgb(', uint256(dna[i]).toString(), ',',
                uint256(dna[(i + 1) % 8]).toString(), ',',
                uint256(dna[(i + 2) % 8]).toString(),
                ')" opacity="', opacity, '"/>'
            );
        }
        return string(circles);
    }

    function _generateCenterElement(uint8[8] memory dna, bool isDeath) internal pure returns (string memory) {
        string memory color = isDeath
            ? string(abi.encodePacked("rgb(", uint256(dna[0] / 2).toString(), ",0,", uint256(dna[7] / 3).toString(), ")"))
            : string(abi.encodePacked("rgb(", uint256(dna[0]).toString(), ",", uint256(dna[2]).toString(), ",", uint256(dna[4]).toString(), ")"));

        string memory label = isDeath ? "DEPARTED" : "ALIVE";

        return string(
            abi.encodePacked(
                '<circle cx="200" cy="200" r="50" fill="', color, '" opacity="0.9"/>',
                '<text x="200" y="205" text-anchor="middle" fill="white" font-size="14" font-family="monospace">', label, '</text>'
            )
        );
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
