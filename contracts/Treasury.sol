// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/ITreasury.sol";

contract Treasury is OwnableUpgradeable, ITreasury {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public constant GNOSIS_WALLET = 0x4c4B657574782E68ECEdabA8151e25dC2C9C1C70;

    address public recipient;
    IERC20Upgradeable[] public allowedTokens;

    uint256[50] __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Contract initialization
    /// @param _recipient Address of the funds recipient
    /// @param _doppy Address of the DOPPY token
    /// @param _bnh Address of the BNH token
    /// @param _usdt Address of the USDT token
    function initialize(
        address _recipient,
        IERC20Upgradeable _doppy,
        IERC20Upgradeable _bnh,
        IERC20Upgradeable _usdt
    ) external initializer {
        __Ownable_init();

        if (address(_doppy) == address(0)) revert ZeroAddress();
        if (address(_bnh) == address(0)) revert ZeroAddress();
        if (address(_usdt) == address(0)) revert ZeroAddress();

        if (_recipient == address(0)) revert ZeroAddress();

        recipient = _recipient;

        allowedTokens.push(_doppy);
        allowedTokens.push(_bnh);
        allowedTokens.push(_usdt);

        transferOwnership(GNOSIS_WALLET);
    }

    /**
     * @param _amount Amount of tokens
     * @param _option Index of the token in the allowedTokens array
     */
    function withdraw(uint256 _amount, uint256 _option) external virtual {
        if (address(allowedTokens[_option]) == address(0))
            revert OptionDisabled();

        allowedTokens[_option].safeTransfer(recipient, _amount);

        emit TokenWithdrawn(recipient, _amount, _option);
    }

    /**
     * @param _token Token address
     * @param _amount Amount
     */
    function withdrawToken(
        IERC20Upgradeable _token,
        uint256 _amount
    ) external virtual onlyOwner {
        SafeERC20Upgradeable.safeTransfer(_token, msg.sender, _amount);

        emit TokenWithdrawnByOwner(address(_token), _amount);
    }

    /**
     * @param _token Token address
     */
    function addToken(IERC20Upgradeable _token) external onlyOwner {
        if (address(_token) == address(0)) revert ZeroAddress();
        allowedTokens.push(_token);

        emit TokenAdded(address(_token));
    }

    /**
     * @param _index Token index
     */
    function disableToken(uint256 _index) external onlyOwner {
        allowedTokens[_index] = IERC20Upgradeable(address(0));

        emit TokenDisabled(_index);
    }

    /**
     * @param _recipient New recipient address
     */
    function setRecipient(address _recipient) external onlyOwner {
        if (_recipient == address(0)) revert ZeroAddress();
        recipient = _recipient;

        emit RecipientUpdated(_recipient);
    }
}
