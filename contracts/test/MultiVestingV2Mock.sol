// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "../MultiVesting.sol";

contract MultiVestingV2Mock is MultiVesting {
    uint256 public newVariable;

    function setNewVariable(uint256 _newVariable) external {
        newVariable = _newVariable;
    }

    function version() external pure returns (string memory) {
        return "v2";
    }
}
