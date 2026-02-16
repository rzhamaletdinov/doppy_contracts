// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";

import "./DoppyToken.sol";

contract CHEEL is ERC20VotesUpgradeable, DoppyToken {
    address public constant GNOSIS_WALLET = 0x126481E4E79cBc8b4199911342861F7535e76EE7;
    uint256 public constant MAX_SUPPLY = 10 ** 9 * 10 ** 18;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __DoppyToken_init("CHEELEE", "CHEEL");
        __ERC20Votes_init();
        transferOwnership(GNOSIS_WALLET);
    }

    /**
     * @dev Returns the maximum supply of the token.
     */
    function maxSupply() public pure override returns (uint256) {
        return MAX_SUPPLY;
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20VotesUpgradeable, ERC20Upgradeable) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(
        address to,
        uint256 amount
    ) internal override(ERC20VotesUpgradeable, ERC20Upgradeable) {
        super._mint(to, amount);
    }

    function _burn(
        address account,
        uint256 amount
    ) internal override(ERC20VotesUpgradeable, ERC20Upgradeable) {
        super._burn(account, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(DoppyToken, ERC20Upgradeable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function _approve(
        address owner,
        address spender,
        uint256 amount
    ) internal override(DoppyToken, ERC20Upgradeable) {
        super._approve(owner, spender, amount);
    }
}
