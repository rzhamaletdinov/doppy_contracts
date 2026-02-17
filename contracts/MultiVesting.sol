// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./interfaces/IVesting.sol";

contract MultiVesting is IVesting, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public constant GNOSIS_WALLET = 0x42DA5e446453319d4076c91d745E288BFef264D0;

    IERC20Upgradeable public token;
    uint256 public vestingAmount;
    address public manager;
    uint256 public beneficiaryUpdateDelay;
    uint256 public beneficiaryUpdateValidity;

    mapping(address beneficiary => uint256 amount) public released;
    mapping(address beneficiary => Beneficiary) public beneficiary;

    bool public beneficiaryUpdateEnabled;
    bool public emergencyWithdrawEnabled;

    mapping(address beneficiary => UpdateBeneficiaryLock)
        public updateBeneficiaryLock;

    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param _token ERC20 token address
     * @param _beneficiaryUpdateEnabled Beneficiary change allowed
     * @param _emergencyWithdrawEnabled Early withdrawal allowed
     * @param _beneficiaryUpdateDelay Minimum update beneficiary period
     * @param _beneficiaryUpdateValidity Maximum update beneficiary period
     */
    function initialize(
        IERC20Upgradeable _token,
        bool _beneficiaryUpdateEnabled,
        bool _emergencyWithdrawEnabled,
        uint256 _beneficiaryUpdateDelay,
        uint256 _beneficiaryUpdateValidity
    ) external initializer {
        if (address(_token) == address(0)) revert ZeroAddress();

        __Ownable_init();

        beneficiaryUpdateDelay = _beneficiaryUpdateDelay;
        beneficiaryUpdateValidity = _beneficiaryUpdateValidity;
        beneficiaryUpdateEnabled = _beneficiaryUpdateEnabled;
        emergencyWithdrawEnabled = _emergencyWithdrawEnabled;
        token = _token;

        transferOwnership(GNOSIS_WALLET);
    }

    /**
     * @notice Creates vesting schedule for one person
     * @param _beneficiary Beneficiary address
     * @param _start Start timestamp
     * @param _duration Duration in seconds
     * @param _amount Amount of tokens
     * @param _cliff Cliff duration in seconds
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _start,
        uint256 _duration,
        uint256 _amount,
        uint256 _cliff
    ) external override {
        if (_msgSender() != manager) revert OnlyManager();
        if (_beneficiary == address(0)) revert ZeroAddress();
        if (_duration == 0) revert InvalidDuration();
        if (_cliff == 0) revert InvalidCliff();
        if (_amount == 0) revert InvalidAmount(); // Amount must be > 0 for creation

        if (beneficiary[_beneficiary].amount != 0)
            revert BeneficiaryAlreadyExists();

        if (vestingAmount + _amount > token.balanceOf(address(this)))
            revert InsufficientTokens(
                token.balanceOf(address(this)),
                vestingAmount + _amount
            );

        vestingAmount += _amount;

        beneficiary[_beneficiary].start = _start;
        beneficiary[_beneficiary].duration = _duration;
        beneficiary[_beneficiary].cliff = _cliff;
        beneficiary[_beneficiary].amount = _amount;

        emit ScheduleCreated(_beneficiary, _amount);
    }

    /**
     * @notice Updates existing vesting schedule parameters
     * @param _beneficiary Beneficiary address
     * @param _newStart New start timestamp
     * @param _newDuration New duration in seconds
     * @param _newCliff New cliff duration in seconds
     */
    function updateVestingSchedule(
        address _beneficiary,
        uint256 _newStart,
        uint256 _newDuration,
        uint256 _newCliff
    ) external override {
        if (_msgSender() != manager) revert OnlyManager();
        if (_newDuration == 0) revert InvalidDuration();
        if (_newCliff == 0) revert InvalidCliff();

        if (beneficiary[_beneficiary].amount == 0)
            revert UserIsNotBeneficiary();

        // Validating that we are not increasing the cliff period beyond the original schedule's cliff end time relative to new start
        if (
            beneficiary[_beneficiary].start + beneficiary[_beneficiary].cliff <
            _newStart + _newCliff
        ) revert CliffCannotBeIncreased();

        beneficiary[_beneficiary].start = _newStart;
        beneficiary[_beneficiary].duration = _newDuration;
        beneficiary[_beneficiary].cliff = _newCliff;

        emit ScheduleUpdated(_beneficiary, _newStart, _newDuration, _newCliff);
    }

    /**
     * @notice Returns tokens that can be released from vesting.
     * @param _beneficiary Address of the beneficiary
     */
    function release(address _beneficiary) external override {
        (uint256 _releasableAmount, ) = _releasable(
            _beneficiary,
            block.timestamp
        );

        if (_releasableAmount == 0) revert NothingToClaim();

        released[_beneficiary] += _releasableAmount;
        vestingAmount -= _releasableAmount;

        token.safeTransfer(_beneficiary, _releasableAmount);

        emit Released(_releasableAmount, _beneficiary);
    }

    /**
     * @notice Update beneficiary
     * @param _oldBeneficiary Address of the old beneficiary
     * @param _newBeneficiary Address of the new beneficiary
     */
    function updateBeneficiary(
        address _oldBeneficiary,
        address _newBeneficiary
    ) external {
        if (!beneficiaryUpdateEnabled) revert OptionDisabled();
        if (_msgSender() != owner() && _msgSender() != _oldBeneficiary)
            revert Unauthorized();

        if (
            updateBeneficiaryLock[_oldBeneficiary].timestamp != 0 &&
            updateBeneficiaryLock[_oldBeneficiary].timestamp +
                beneficiaryUpdateValidity <=
            block.timestamp
        ) revert UpdatePending();

        if (beneficiary[_oldBeneficiary].amount == 0)
            revert UserIsNotBeneficiary();
        if (beneficiary[_newBeneficiary].amount != 0)
            revert BeneficiaryAlreadyExists();

        updateBeneficiaryLock[_oldBeneficiary] = UpdateBeneficiaryLock(
            _oldBeneficiary,
            _newBeneficiary,
            block.timestamp
        );
    }

    /**
     * @param _oldBeneficiary Address of the old beneficiary
     */
    function finishUpdateBeneficiary(address _oldBeneficiary) external {
        if (!beneficiaryUpdateEnabled) revert OptionDisabled();

        UpdateBeneficiaryLock memory it = updateBeneficiaryLock[
            _oldBeneficiary
        ];

        if (it.timestamp == 0) revert NoPendingUpdate();

        if (beneficiary[it.oldBeneficiary].amount == 0)
            revert UserIsNotBeneficiary();
        if (beneficiary[it.newBeneficiary].amount != 0)
            revert BeneficiaryAlreadyExists();

        if (block.timestamp <= it.timestamp + beneficiaryUpdateDelay)
            revert UpdateLockPeriodNotPassed();
        if (block.timestamp >= it.timestamp + beneficiaryUpdateValidity)
            revert UpdateLockPeriodExpired();
        if (msg.sender != owner() && msg.sender != it.newBeneficiary)
            revert Unauthorized();

        released[it.newBeneficiary] = released[it.oldBeneficiary];
        beneficiary[it.newBeneficiary] = beneficiary[it.oldBeneficiary];

        delete released[it.oldBeneficiary];
        delete beneficiary[it.oldBeneficiary];
        delete updateBeneficiaryLock[it.oldBeneficiary];

        emit BeneficiaryUpdated(it.oldBeneficiary, it.newBeneficiary);
    }

    /**
     * @param _manager Address of the seller
     */
    function setManager(address _manager) external onlyOwner {
        if (_manager == address(0)) revert ZeroAddress();
        manager = _manager;

        emit ManagerUpdated(manager);
    }

    /**
     * @param _token ERC20 token address
     */
    function emergencyVest(
        IERC20Upgradeable _token
    ) external override onlyOwner {
        if (!emergencyWithdrawEnabled) revert OptionDisabled();

        uint256 amount = _token.balanceOf(address(this));
        _token.safeTransfer(owner(), amount);

        if (address(token) == address(_token)) vestingAmount = 0;

        emit EmergencyWithdrawn(amount);
    }

    function disableEarlyWithdraw() external onlyOwner {
        emergencyWithdrawEnabled = false;

        emit EarlyWithdrawDisabled(msg.sender);
    }

    /**
     * @param _beneficiary Address of the beneficiary
     * @param _timestamp Timestamp
     * @return canClaim how much user can claim if they call release function
     * @return earnedAmount how much user has earned
     */
    function releasable(
        address _beneficiary,
        uint256 _timestamp
    ) external view override returns (uint256 canClaim, uint256 earnedAmount) {
        return _releasable(_beneficiary, _timestamp);
    }

    function _releasable(
        address _beneficiary,
        uint256 _timestamp
    ) internal view returns (uint256 canClaim, uint256 earnedAmount) {
        (canClaim, earnedAmount) = _vestingSchedule(
            _beneficiary,
            beneficiary[_beneficiary].amount,
            _timestamp
        );
        if (released[_beneficiary] > canClaim) canClaim = 0;
        else canClaim -= released[_beneficiary];
    }

    /**
     * @param _beneficiary Address of the beneficiary
     * @param _timestamp Timestamp
     * @return vestedAmount how much was earned
     * @return maxAmount how much tokens can be earned
     */
    function vestedAmountBeneficiary(
        address _beneficiary,
        uint256 _timestamp
    ) external view override returns (uint256 vestedAmount, uint256 maxAmount) {
        return _vestedAmountBeneficiary(_beneficiary, _timestamp);
    }

    function _vestedAmountBeneficiary(
        address _beneficiary,
        uint256 _timestamp
    ) internal view returns (uint256 vestedAmount, uint256 maxAmount) {
        maxAmount = beneficiary[_beneficiary].amount;
        (, vestedAmount) = _vestingSchedule(
            _beneficiary,
            maxAmount,
            _timestamp
        );
    }

    function _vestingSchedule(
        address _beneficiary,
        uint256 _totalAllocation,
        uint256 _timestamp
    ) internal view returns (uint256, uint256) {
        if (_timestamp < beneficiary[_beneficiary].start) {
            return (0, 0);
        } else if (
            _timestamp >
            beneficiary[_beneficiary].start + beneficiary[_beneficiary].duration
        ) {
            return (_totalAllocation, _totalAllocation);
        } else {
            uint256 res = (_totalAllocation *
                (_timestamp - beneficiary[_beneficiary].start)) /
                beneficiary[_beneficiary].duration;

            if (
                _timestamp <
                beneficiary[_beneficiary].start +
                    beneficiary[_beneficiary].cliff
            ) return (0, res);
            else return (res, res);
        }
    }
}
