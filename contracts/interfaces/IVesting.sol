// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

interface IVesting {
    // Events
    event Released(uint256 amount, address to);
    event ManagerUpdated(address newManager);
    event ScheduleCreated(address indexed beneficiary, uint256 amount);
    event EmergencyWithdrawn(uint256 amount);
    event BeneficiaryUpdated(
        address indexed oldBeneficiary,
        address indexed newBeneficiary
    );
    event EarlyWithdrawDisabled(address owner);

    event ScheduleUpdated(
        address indexed beneficiary,
        uint256 newStart,
        uint256 newDuration,
        uint256 newCliff
    );

    // Errors
    error ZeroAddress();
    error InsufficientTokens(uint256 available, uint256 required);
    error OnlyManager();
    error InvalidDuration();
    error InvalidCliff();
    error BeneficiaryAlreadyExists();
    error UserIsNotBeneficiary();
    error CliffCannotBeIncreased();
    error NothingToClaim();
    error OptionDisabled();
    error Unauthorized();
    error UpdatePending();
    error NoPendingUpdate();
    error UpdateLockPeriodNotPassed();
    error UpdateLockPeriodExpired();
    error InvalidAmount();

    // Structs
    struct Beneficiary {
        uint256 start;
        uint256 duration;
        uint256 cliff;
        uint256 amount;
    }

    struct UpdateBeneficiaryLock {
        address oldBeneficiary;
        address newBeneficiary;
        uint256 timestamp;
    }

    // Functions
    function createVestingSchedule(
        address beneficiary,
        uint256 start,
        uint256 duration,
        uint256 amount,
        uint256 cliff
    ) external;

    function updateVestingSchedule(
        address beneficiary,
        uint256 newStart,
        uint256 newDuration,
        uint256 newCliff
    ) external;

    function release(address _beneficiary) external;

    function releasable(
        address _beneficiary,
        uint256 _timestamp
    ) external view returns (uint256 canClaim, uint256 earnedAmount);

    function vestedAmountBeneficiary(
        address _beneficiary,
        uint256 _timestamp
    ) external view returns (uint256 vestedAmount, uint256 maxAmount);

    function emergencyVest(IERC20Upgradeable _token) external;
}
