// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @dev Minimal VRFConsumerBaseV2Plus abstraction since the full Chainlink contracts
///      are not available in this repo. In production, replace with the real import.
abstract contract VRFConsumerBaseV2Plus {
    uint256 internal immutable i_vrfSubscriptionId;
    address internal immutable i_vrfCoordinator;

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
    }

    constructor(address coordinator, uint256 subscriptionId) {
        i_vrfCoordinator = coordinator;
        i_vrfSubscriptionId = subscriptionId;
    }

    function _requestRandomWords(RandomWordsRequest memory req) internal virtual returns (uint256 requestId) {
        (bool success, bytes memory data) = i_vrfCoordinator.call(
            abi.encodeWithSignature(
                "requestRandomWords(bytes32,uint256,uint16,uint32,uint32)",
                req.keyHash,
                req.subId,
                req.requestConfirmations,
                req.callbackGasLimit,
                req.numWords
            )
        );
        require(success, "VRF: request failed");
        requestId = abi.decode(data, (uint256));
    }

    function rawFulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) external {
        require(msg.sender == i_vrfCoordinator, "VRF: only coordinator");
        fulfillRandomWords(requestId, randomWords);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual;
}

interface IBloodlineRegistryVRF {
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

    function birthAgent(
        address ownerAddress,
        address agentWallet,
        DNA calldata dna,
        uint256 parentId,
        string calldata metadataURI
    ) external payable returns (uint256 agentId);

    function registrationFee() external view returns (uint256);
    function getDNA(uint256 agentId) external view returns (DNA memory);
}

interface IBloodlineNFTVRF {
    function mintBirthNFT(uint256 agentId, uint8[8] calldata dna, address to) external;
}

/// @title VRFConsumer
/// @notice Handles VRF-based random DNA generation for genesis and fork births
contract VRFConsumer is VRFConsumerBaseV2Plus, Ownable {
    struct PendingBirth {
        address owner;
        address agentWallet;
        uint256 parentId;
        uint8[8] parentTraits;
        bool isFork;
        string metadataURI;
        string executionEndpoint;
    }

    IBloodlineRegistryVRF public registry;
    IBloodlineNFTVRF public nft;

    bytes32 public keyHash;
    uint16 public requestConfirmations = 3;
    uint32 public callbackGasLimit = 500_000;

    mapping(uint256 => PendingBirth) public pendingBirths;

    uint256 public constant PRODIGY_THRESHOLD = 249;
    uint256 public constant PRODIGY_MIN_COUNT = 3;

    event BirthRequested(uint256 indexed requestId, address indexed owner, bool isFork);
    event BirthFulfilled(uint256 indexed agentId, address indexed owner, bool isProdigy);
    event ProdigyBorn(uint256 indexed agentId, uint8[8] dna);

    constructor(
        address coordinator,
        uint256 subscriptionId,
        bytes32 _keyHash,
        address _registry,
        address _nft
    ) VRFConsumerBaseV2Plus(coordinator, subscriptionId) Ownable(msg.sender) {
        keyHash = _keyHash;
        registry = IBloodlineRegistryVRF(_registry);
        nft = IBloodlineNFTVRF(_nft);
    }

    function requestGenesisBirth(
        address agentWallet,
        string calldata metadataURI,
        string calldata executionEndpoint
    ) external payable returns (uint256 requestId) {
        uint8[8] memory emptyTraits;
        requestId = _requestRandomWords(
            RandomWordsRequest({
                keyHash: keyHash,
                subId: i_vrfSubscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1
            })
        );

        pendingBirths[requestId] = PendingBirth({
            owner: msg.sender,
            agentWallet: agentWallet,
            parentId: 0,
            parentTraits: emptyTraits,
            isFork: false,
            metadataURI: metadataURI,
            executionEndpoint: executionEndpoint
        });

        emit BirthRequested(requestId, msg.sender, false);
    }

    function requestForkBirth(
        uint256 parentId,
        address agentWallet,
        string calldata metadataURI,
        string calldata executionEndpoint
    ) external payable returns (uint256 requestId) {
        IBloodlineRegistryVRF.DNA memory parentDNA = registry.getDNA(parentId);
        uint8[8] memory traits = _dnaToArray(parentDNA);

        requestId = _requestRandomWords(
            RandomWordsRequest({
                keyHash: keyHash,
                subId: i_vrfSubscriptionId,
                requestConfirmations: requestConfirmations,
                callbackGasLimit: callbackGasLimit,
                numWords: 1
            })
        );

        pendingBirths[requestId] = PendingBirth({
            owner: msg.sender,
            agentWallet: agentWallet,
            parentId: parentId,
            parentTraits: traits,
            isFork: true,
            metadataURI: metadataURI,
            executionEndpoint: executionEndpoint
        });

        emit BirthRequested(requestId, msg.sender, true);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        PendingBirth storage birth = pendingBirths[requestId];
        require(birth.owner != address(0), "VRFConsumer: unknown request");

        uint8[8] memory traits;

        if (birth.isFork) {
            for (uint256 i = 0; i < 8; i++) {
                uint256 seed = uint256(keccak256(abi.encodePacked(randomWords[0], i)));
                traits[i] = _mutateTrait(birth.parentTraits[i], seed);
            }
        } else {
            traits = _genesisTraits(randomWords[0]);
        }

        IBloodlineRegistryVRF.DNA memory dna = _arrayToDNA(traits);
        uint256 fee = registry.registrationFee();
        uint256 agentId = registry.birthAgent{value: fee}(
            birth.owner,
            birth.agentWallet,
            dna,
            birth.parentId,
            birth.metadataURI
        );

        nft.mintBirthNFT(agentId, traits, birth.owner);

        bool isProdigy = _checkProdigy(traits);
        if (isProdigy) {
            emit ProdigyBorn(agentId, traits);
        }

        emit BirthFulfilled(agentId, birth.owner, isProdigy);
        delete pendingBirths[requestId];
    }

    function _mutateTrait(uint8 base, uint256 seed) internal pure returns (uint8) {
        uint256 delta = seed % 26;
        bool direction = ((seed >> 8) % 2) == 0;

        if (direction) {
            uint256 result = uint256(base) + delta;
            return result > 255 ? 255 : uint8(result);
        } else {
            if (delta > uint256(base)) return 0;
            return uint8(uint256(base) - delta);
        }
    }

    function _genesisTraits(uint256 randomWord) internal pure returns (uint8[8] memory traits) {
        for (uint256 i = 0; i < 8; i++) {
            traits[i] = uint8(randomWord >> (i * 32));
        }
    }

    function _checkProdigy(uint8[8] memory traits) internal pure returns (bool) {
        uint256 count = 0;
        for (uint256 i = 0; i < 8; i++) {
            if (traits[i] >= PRODIGY_THRESHOLD) {
                count++;
            }
        }
        return count >= PRODIGY_MIN_COUNT;
    }

    function _dnaToArray(IBloodlineRegistryVRF.DNA memory dna) internal pure returns (uint8[8] memory) {
        return [
            dna.intelligence, dna.speed, dna.creativity, dna.frugality,
            dna.riskAppetite, dna.socialEnergy, dna.loyalty, dna.resilience
        ];
    }

    function _arrayToDNA(uint8[8] memory traits) internal pure returns (IBloodlineRegistryVRF.DNA memory) {
        return IBloodlineRegistryVRF.DNA({
            intelligence: traits[0],
            speed: traits[1],
            creativity: traits[2],
            frugality: traits[3],
            riskAppetite: traits[4],
            socialEnergy: traits[5],
            loyalty: traits[6],
            resilience: traits[7]
        });
    }

    function setKeyHash(bytes32 _keyHash) external onlyOwner {
        keyHash = _keyHash;
    }

    function setCallbackGasLimit(uint32 _callbackGasLimit) external onlyOwner {
        callbackGasLimit = _callbackGasLimit;
    }

    function setRequestConfirmations(uint16 _requestConfirmations) external onlyOwner {
        requestConfirmations = _requestConfirmations;
    }

    function setRegistry(address _registry) external onlyOwner {
        registry = IBloodlineRegistryVRF(_registry);
    }

    function setNFT(address _nft) external onlyOwner {
        nft = IBloodlineNFTVRF(_nft);
    }

    receive() external payable {}
}
