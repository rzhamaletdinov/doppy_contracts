// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./DoppyToken.sol";

contract DOPPY is DoppyToken {
    address public constant GNOSIS_WALLET =
        0xE6e74cA74e2209A5f2272f531627f44d34AFc299;
    uint256 public constant MAX_SUPPLY = 30 * 10 ** 9 * 10 ** 18;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __DoppyToken_init("Dreams, Optimism, Playfulness & You", "DOPPY");
        transferOwnership(GNOSIS_WALLET);
    }

    /**
     * @dev Returns the maximum supply of the token.
     */
    function maxSupply() public pure override returns (uint256) {
        return MAX_SUPPLY;
    }
}
