// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/draft-EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/ITreasury.sol";

/// @title Treasury
/// @notice Contract for withdrawing tokens with EIP712 signature verification
contract Treasury is EIP712Upgradeable, OwnableUpgradeable, ITreasury {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public constant GNOSIS_WALLET = 0x4c4B657574782E68ECEdabA8151e25dC2C9C1C70;

    string public constant NAME = "TREASURY";
    string public constant EIP712_VERSION = "1";

    /// @notice Typehash for ERC20 token withdrawal signature
    bytes32 public constant PASS_TYPEHASH =
        keccak256(
            "WithdrawSignature(uint256 nonce,uint256 amount,uint256 option)"
        );

    /// @notice Used signatures tracked by nonce
    mapping(uint256 => bool) private usedSignature;

    /// @notice Funds recipient address
    address public recipient;

    /// @notice Signer address for signature verification
    address public signer;

    /// @notice Array of allowed tokens
    IERC20Upgradeable[] public allowedTokens;

    uint256[50] __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Contract initialization
    /// @param _recipient Funds recipient address
    /// @param _doppy DOPPY token address
    /// @param _bnh BNH token address
    /// @param _usdt USDT token address
    /// @param _signer Signer address
    function initialize(
        address _recipient,
        IERC20Upgradeable _doppy,
        IERC20Upgradeable _bnh,
        IERC20Upgradeable _usdt,
        address _signer
    ) external initializer {
        __Ownable_init();
        __EIP712_init(NAME, EIP712_VERSION);

        if (address(_doppy) == address(0)) revert ZeroAddress();
        if (address(_bnh) == address(0)) revert ZeroAddress();
        if (address(_usdt) == address(0)) revert ZeroAddress();
        if (_recipient == address(0)) revert ZeroAddress();
        if (_signer == address(0)) revert ZeroAddress();

        recipient = _recipient;
        signer = _signer;

        allowedTokens.push(_doppy);
        allowedTokens.push(_bnh);
        allowedTokens.push(_usdt);

        transferOwnership(GNOSIS_WALLET);
    }

    /// @notice Verify ERC20 withdrawal signature
    /// @param _nonce Unique signature identifier
    /// @param _amount Token amount
    /// @param _option Token index in allowedTokens array
    /// @param _signature Signature bytes
    /// @return Recovered signer address
    function verifySignature(
        uint256 _nonce,
        uint256 _amount,
        uint256 _option,
        bytes memory _signature
    ) public view virtual returns (address) {
        bytes32 _digest = _hashTypedDataV4(
            keccak256(abi.encode(PASS_TYPEHASH, _nonce, _amount, _option))
        );
        return ECDSAUpgradeable.recover(_digest, _signature);
    }

    /// @notice Withdraw ERC20 tokens with signature verification
    /// @param _nonce Unique signature identifier
    /// @param _amount Token amount
    /// @param _option Token index in allowedTokens array
    /// @param _signature Signature bytes
    function withdraw(
        uint256 _nonce,
        uint256 _amount,
        uint256 _option,
        bytes memory _signature
    ) external virtual {
        if (address(allowedTokens[_option]) == address(0))
            revert OptionDisabled();

        if (verifySignature(_nonce, _amount, _option, _signature) != signer)
            revert BadSignature();

        if (usedSignature[_nonce]) revert SignatureAlreadyUsed();

        usedSignature[_nonce] = true;

        allowedTokens[_option].safeTransfer(recipient, _amount);

        emit TokenWithdrawn(recipient, _amount, _option);
    }

    /// @notice Withdraw arbitrary token by owner
    /// @param _token Token address
    /// @param _amount Amount
    function withdrawToken(
        IERC20Upgradeable _token,
        uint256 _amount
    ) external virtual onlyOwner {
        SafeERC20Upgradeable.safeTransfer(_token, msg.sender, _amount);

        emit TokenWithdrawnByOwner(address(_token), _amount);
    }

    /// @notice Add new allowed token
    /// @param _token Token address
    function addToken(IERC20Upgradeable _token) external onlyOwner {
        if (address(_token) == address(0)) revert ZeroAddress();
        allowedTokens.push(_token);

        emit TokenAdded(address(_token));
    }

    /// @notice Disable token by index
    /// @param _index Token index
    function disableToken(uint256 _index) external onlyOwner {
        allowedTokens[_index] = IERC20Upgradeable(address(0));

        emit TokenDisabled(_index);
    }

    /// @notice Set recipient address
    /// @param _recipient New recipient address
    function setRecipient(address _recipient) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddress();
        recipient = _recipient;

        emit RecipientUpdated(_recipient);
    }

    /// @notice Set signer address
    /// @param _signer New signer address
    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        signer = _signer;

        emit SignerUpdated(_signer);
    }
}
