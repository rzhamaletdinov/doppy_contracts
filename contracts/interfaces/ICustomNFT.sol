// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.18;

// interface ICustomNFT {
//     event SaleContractUpdated(address indexed sale);
//     event TreasuryContractUpdated(address indexed treasury);
//     event ReceiveNFT(address indexed receiver, uint256 indexed tokenId);
//     event URIUpdated(string uri);

//     /// @notice Error: call not allowed (not sale and not treasury)
//     error NotAllowedCaller();
//     /// @notice Error: zero address
//     error ZeroAddressNotAllowed();
//     /// @notice Error: User is blocked in the global blocklist
//     error BlockedByGlobalBlockList();
//     /// @notice Error: User is blocked in the internal blocklist
//     error BlockedByInternalBlockList();

//     /**
//      * @notice Transfer or mint NFT from sale contract or treasury
//      * @param _to: recipient address
//      * @param _tokenId: token identifier
//      *
//      */
//     function receiveNFT(address _to, uint256 _tokenId) external;

//     /**
//      * @notice Minting NFT
//      * @param _to: recipient address
//      * @param _tokenId: token identifier
//      *
//      * @dev Called by the owner
//      *
//      */
//     function safeMint(address _to, uint256 _tokenId) external;

//     /**
//      * @notice Setting base URI for NFT collection
//      * @param _uri: new base URI
//      *
//      * @dev Called by the owner
//      *
//      */
//     function setUri(string memory _uri) external;

//     /**
//      * @notice Setting sale contract address
//      * @param _nftSale: NFT sale contract address
//      *
//      * @dev Called by the owner
//      *
//      */
//     function setSaleContract(address _nftSale) external;

//     /**
//      * @notice Setting treasury contract address
//      * @param _treasury: treasury contract address
//      *
//      * @dev Called by the owner
//      *
//      */
//     function setTreasuryContract(address _treasury) external;

//     /**
//      * @notice Getting information about tokens owned by user
//      * @param _addr: user address
//      *
//      */
//     function tokensOwnedByUser(
//         address _addr
//     ) external view returns (uint256[] memory tokenIds);
// }
