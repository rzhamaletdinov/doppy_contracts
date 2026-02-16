// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.18;

// import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// import "./interfaces/IBlockList.sol";
// import "./interfaces/ICustomNFT.sol";

// contract NFT is ICustomNFT, ERC721EnumerableUpgradeable, OwnableUpgradeable {
//     // solhint-disable-next-line var-name-mixedcase
//     string public NAME;
//     // solhint-disable-next-line var-name-mixedcase
//     string public SYMBOL;
//     string private baseURI;

//     address public nftSale;
//     address public treasury;
//     address public constant GNOSIS_WALLET =
//         0xC40b7fBb7160B98323159BA800e122C9DeD0668D;
//     IBlockList public blockList;

//     uint256[49] private __gap;

//     /// @custom:oz-upgrades-unsafe-allow constructor
//     constructor() {
//         _disableInitializers();
//     }

//     function initialize(
//         string memory _name,
//         string memory _symbol
//     ) external initializer {
//         __Ownable_init();
//         __ERC721_init(_name, _symbol);
//         __ERC721Enumerable_init();

//         NAME = _name;
//         SYMBOL = _symbol;

//         transferOwnership(GNOSIS_WALLET);
//     }

//     /**
//      * @param _to: recipient address
//      * @param _tokenId: token id
//      */
//     function receiveNFT(address _to, uint256 _tokenId) external override {
//         if (msg.sender != nftSale && msg.sender != treasury)
//             revert NotAllowedCaller();

//         if (_exists(_tokenId)) {
//             safeTransferFrom(msg.sender, _to, _tokenId);
//         } else {
//             _safeMint(_to, _tokenId);
//         }

//         emit ReceiveNFT(_to, _tokenId);
//     }

//     /**
//      * @param _to: recipient address
//      * @param _tokenId: token id
//      */
//     function safeMint(address _to, uint256 _tokenId) external onlyOwner {
//         _safeMint(_to, _tokenId);
//     }

//     /**
//      * @param _uri: new base URI
//      */
//     function setUri(string memory _uri) external onlyOwner {
//         baseURI = _uri;

//         emit URIUpdated(_uri);
//     }

//     /**
//      * @param _nftSale: NFT sale contract address
//      */
//     function setSaleContract(address _nftSale) external onlyOwner {
//         if (_nftSale == address(0)) revert ZeroAddressNotAllowed();

//         nftSale = _nftSale;

//         emit SaleContractUpdated(_nftSale);
//     }

//     /**
//      * @param _treasury: treasury contract address
//      */
//     function setTreasuryContract(address _treasury) external onlyOwner {
//         if (_treasury == address(0)) revert ZeroAddressNotAllowed();

//         treasury = _treasury;

//         emit TreasuryContractUpdated(_treasury);
//     }

//     /**
//      * @param _addr: user address
//      */
//     function tokensOwnedByUser(
//         address _addr
//     ) external view returns (uint256[] memory) {
//         uint256 balance = balanceOf(_addr);
//         uint256[] memory tokenIds = new uint256[](balance);

//         for (uint256 i = 0; i < balance; i++) {
//             tokenIds[i] = tokenOfOwnerByIndex(_addr, i);
//         }

//         return tokenIds;
//     }

//     /**
//      * @param _blockList: blocklist contract address
//      */
//     function setBlockList(IBlockList _blockList) external onlyOwner {
//         blockList = _blockList;
//     }

//     /**
//      * @notice Returns base URI
//      */
//     function _baseURI() internal view override returns (string memory) {
//         return baseURI;
//     }

//     /**
//      * @dev Hook called before any token transfer.
//      * Includes minting and burning.
//      */
//     function _beforeTokenTransfer(
//         address from,
//         address to,
//         uint256 tokenId
//     ) internal virtual override {
//         if (address(blockList) != address(0)) {
//             if (blockList.userIsBlocked(_msgSender(), from, to))
//                 revert BlockedByGlobalBlockList();
//             if (
//                 blockList.userIsInternalBlocked(
//                     address(this),
//                     _msgSender(),
//                     from,
//                     to
//                 )
//             ) revert BlockedByInternalBlockList();
//         }
//         super._beforeTokenTransfer(from, to, tokenId);
//     }

//     /**
//      * @dev Approves `to` for operations with `tokenId`
//      *
//      * Emits an {Approval} event.
//      */
//     function _approve(address to, uint256 tokenId) internal virtual override {
//         if (address(blockList) != address(0)) {
//             if (blockList.userIsBlocked(address(0), address(0), to))
//                 revert BlockedByGlobalBlockList();
//             if (
//                 blockList.userIsInternalBlocked(
//                     address(this),
//                     address(0),
//                     address(0),
//                     to
//                 )
//             ) revert BlockedByInternalBlockList();
//         }
//         super._approve(to, tokenId);
//     }

//     /**
//      * @dev Approves `operator` for all operations with `owner`'s tokens
//      *
//      * Emits an {ApprovalForAll} event.
//      */
//     function _setApprovalForAll(
//         address owner,
//         address operator,
//         bool approved
//     ) internal virtual override {
//         if (address(blockList) != address(0)) {
//             if (blockList.userIsBlocked(owner, operator, address(0)))
//                 revert BlockedByGlobalBlockList();
//             if (
//                 blockList.userIsInternalBlocked(
//                     address(this),
//                     owner,
//                     operator,
//                     address(0)
//                 )
//             ) revert BlockedByInternalBlockList();
//         }
//         super._setApprovalForAll(owner, operator, approved);
//     }
// }
