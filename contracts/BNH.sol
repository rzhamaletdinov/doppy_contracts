// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./DoppyToken.sol";

contract BNH is DoppyToken {
    address public constant GNOSIS_WALLET = 0x126481E4E79cBc8b4199911342861F7535e76EE7;
    uint256 public constant MAX_SUPPLY = 10 ** 9 * 10 ** 18;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __DoppyToken_init("Beyond Normal Horizons", "BNH");
        transferOwnership(GNOSIS_WALLET);
    }

    /**
     * @dev Returns the maximum supply of the token.
     */
    function maxSupply() public pure override returns (uint256) {
        return MAX_SUPPLY;
    }
}
