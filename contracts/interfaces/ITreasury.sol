// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/// @title ITreasury
/// @notice Interface for Treasury contract — events and custom errors
interface ITreasury {
    // --- Errors ---

    /// @notice Zero address provided
    error ZeroAddress();

    /// @notice Option (token) disabled
    error OptionDisabled();

    /// @notice Invalid signature
    error BadSignature();

    /// @notice Signature expired
    error SignatureExpired();

    /// @notice Signature (nonce) already used
    error SignatureAlreadyUsed();

    // --- Events ---

    /// @notice ERC20 token withdrawn to recipient
    event TokenWithdrawn(
        address indexed user,
        uint256 amount,
        uint256 indexed option
    );

    /// @notice New ERC20 token added
    event TokenAdded(address addr);

    /// @notice ERC20 token disabled
    event TokenDisabled(uint256 index);

    /// @notice Owner withdrew tokens
    event TokenWithdrawnByOwner(address token, uint256 amount);

    /// @notice Recipient address updated
    event RecipientUpdated(address newRecipient);

    /// @notice Signer address updated
    event SignerUpdated(address signer);

    // --- Functions ---

    function initialize(
        address _recipient,
        IERC20Upgradeable _doppy,
        IERC20Upgradeable _bnh,
        IERC20Upgradeable _usdt,
        address _signer
    ) external;

    function verifySignature(
        uint256 _nonce,
        uint256 _amount,
        uint256 _option,
        uint256 _ttl,
        bytes memory _signature
    ) external view returns (address);

    function withdraw(
        uint256 _nonce,
        uint256 _amount,
        uint256 _option,
        uint256 _ttl,
        bytes memory _signature
    ) external;

    function withdrawToken(IERC20Upgradeable _token, uint256 _amount) external;

    function addToken(IERC20Upgradeable _token) external;

    function disableToken(uint256 _index) external;

    function setRecipient(address _recipient) external;

    function setSigner(address _signer) external;

    // --- Getters ---

    function GNOSIS_WALLET() external view returns (address);
    function NAME() external view returns (string memory);
    function EIP712_VERSION() external view returns (string memory);
    function PASS_TYPEHASH() external view returns (bytes32);
    function recipient() external view returns (address);
    function signer() external view returns (address);
    function allowedTokens(
        uint256 index
    ) external view returns (IERC20Upgradeable);
}
