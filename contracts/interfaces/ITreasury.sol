// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

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
}
