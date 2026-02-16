// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IBlockList.sol";

/// @title BlockList
/// @notice Contract for managing global and internal blocklists, transfer limits and exclusion list
contract BlockList is IBlockList, OwnableUpgradeable, AccessControlUpgradeable {
    bytes32 public constant BLOCKLIST_ADMIN_ROLE = keccak256("BLOCKLIST_ADMIN_ROLE");
    address public constant GNOSIS_WALLET = 0x126481E4E79cBc8b4199911342861F7535e76EE7;

    mapping(address user => bool isBlocked) public globalBlockList;
    mapping(address token => mapping(address user => bool isBlocked)) public internalBlockList;
    // token => limits enabling { hasDailyIncomeLimit, hasMonthlyIncomeLimit, hasDailyOutcomeLimit, hasMonthlyOutcomeLimit }
    mapping(address token => TokenLimitDisabling) public tokensWithLimits;
    mapping(address contractAddress => bool isContractExcluded) public contractsExclusionList;

    // token => limits { dailyIncome, monthlyIncome, dailyOutcome, monthlyOutcome }
    mapping(address token => TokenLimit) public tokenLimits;
    mapping(address token => mapping(address user => mapping(uint256 date => TokenTransfers transfers)))
        public tokenTransfers;


    uint256[50] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    modifier onlyBlockListAdmin() {
        if (!hasRole(BLOCKLIST_ADMIN_ROLE, _msgSender()))
            revert NotBlockListAdmin();
        _;
    }

    function initialize() external initializer {
        __AccessControl_init();
        __Ownable_init();

        contractsExclusionList[address(0)] = true;

        transferOwnership(GNOSIS_WALLET);

        _setupRole(DEFAULT_ADMIN_ROLE, GNOSIS_WALLET);
        _setupRole(BLOCKLIST_ADMIN_ROLE, GNOSIS_WALLET);
    }

    /**
     * @param _users array of addresses to add
     */
    function addUsersToBlockList(
        address[] memory _users
    ) external onlyBlockListAdmin {
        for (uint256 i; i < _users.length; i++) {
            if (_users[i] == address(0)) revert ZeroAddressNotAllowed();

            globalBlockList[_users[i]] = true;
        }
    }

    /**
     * @param _token token contract address
     * @param _users array of addresses to add
     */
    function addUsersToInternalBlockList(
        address _token,
        address[] memory _users
    ) external onlyBlockListAdmin {
        mapping(address => bool)
            storage tokenInternalBlockList = internalBlockList[_token];

        for (uint256 i; i < _users.length; i++) {
            if (_users[i] == address(0)) revert ZeroAddressNotAllowed();

            tokenInternalBlockList[_users[i]] = true;
        }
    }

    /**
     * @param _users array of addresses to remove
     */
    function removeUsersFromBlockList(
        address[] memory _users
    ) external onlyBlockListAdmin {
        for (uint256 i; i < _users.length; i++) {
            globalBlockList[_users[i]] = false;
        }
    }

    /**
     * @param _token token contract address
     * @param _users array of addresses to remove
     */
    function removeUsersFromInternalBlockList(
        address _token,
        address[] memory _users
    ) external onlyBlockListAdmin {
        for (uint256 i; i < _users.length; i++) {
            internalBlockList[_token][_users[i]] = false;
        }
    }

    /**
     * @param _token token contract address
     * @param _dailyIncomeLimit daily income limit
     * @param _monthlyIncomeLimit monthly income limit
     * @param _dailyOutcomeLimit daily outcome limit
     * @param _monthlyOutcomeLimit monthly outcome limit
     */
    function setTokenLimits(
        address _token,
        uint256 _dailyIncomeLimit,
        uint256 _monthlyIncomeLimit,
        uint256 _dailyOutcomeLimit,
        uint256 _monthlyOutcomeLimit
    ) external onlyBlockListAdmin {
        tokenLimits[_token] = TokenLimit(
            _dailyIncomeLimit,
            _monthlyIncomeLimit,
            _dailyOutcomeLimit,
            _monthlyOutcomeLimit
        );

        emit TokenLimitUpdated(
            _token,
            _dailyIncomeLimit,
            _monthlyIncomeLimit,
            _dailyOutcomeLimit,
            _monthlyOutcomeLimit
        );
    }

    /**
     * @param _contract contract address
     */
    function addContractToExclusionList(
        address _contract
    ) external onlyBlockListAdmin {
        contractsExclusionList[_contract] = true;

        emit AddToExclusionList(_contract);
    }

    /**
     * @param _contract contract address
     */
    function removeContractFromExclusionList(
        address _contract
    ) external onlyBlockListAdmin {
        contractsExclusionList[_contract] = false;

        emit RemoveFromExclusionList(_contract);
    }

    /**
     * @param _from sender address
     * @param _to recipient address
     * @param _amount amount of transferred tokens
     */
    function limitAllows(address _from, address _to, uint256 _amount) external {
        address _token = _msgSender();
        TokenLimitDisabling storage _limits = tokensWithLimits[_token];
        mapping(address => mapping(uint256 => TokenTransfers))
            storage _tokenTransferDay = tokenTransfers[_token];

        uint256 currentMonth = getCurrentMonth();
        uint256 currentDay = getCurrentDay();

        if (_limits.hasDailyOutcomeLimit && !contractsExclusionList[_from]) {
            if (
                _tokenTransferDay[_from][currentDay].outcome + _amount >
                tokenLimits[_token].dailyOutcome
            ) revert DailyOutcomeLimitReached();

            _tokenTransferDay[_from][currentDay].outcome += _amount;
        }

        if (_limits.hasMonthlyOutcomeLimit && !contractsExclusionList[_from]) {
            if (
                _tokenTransferDay[_from][currentMonth].outcome + _amount >
                tokenLimits[_token].monthlyOutcome
            ) revert MonthlyOutcomeLimitReached();

            _tokenTransferDay[_from][currentMonth].outcome += _amount;
        }

        if (_limits.hasDailyIncomeLimit && !contractsExclusionList[_to]) {
            if (
                _tokenTransferDay[_to][currentDay].income + _amount >
                tokenLimits[_token].dailyIncome
            ) revert DailyIncomeLimitReached();

            _tokenTransferDay[_to][currentDay].income += _amount;
        }

        if (_limits.hasMonthlyIncomeLimit && !contractsExclusionList[_to]) {
            if (
                _tokenTransferDay[_to][currentMonth].income + _amount >
                tokenLimits[_token].monthlyIncome
            ) revert MonthlyIncomeLimitReached();

            _tokenTransferDay[_to][currentMonth].income += _amount;
        }
    }

    /**
     * @param _token token contract address
     * @param _hasDailyIncomeLimit enable daily income limit
     * @param _hasMonthlyIncomeLimit enable monthly income limit
     * @param _hasDailyOutcomeLimit enable daily outcome limit
     * @param _hasMonthlyOutcomeLimit enable monthly outcome limit
     */
    function changeDisablingTokenLimits(
        address _token,
        bool _hasDailyIncomeLimit,
        bool _hasMonthlyIncomeLimit,
        bool _hasDailyOutcomeLimit,
        bool _hasMonthlyOutcomeLimit
    ) external onlyBlockListAdmin {
        tokensWithLimits[_token] = TokenLimitDisabling(
            _hasDailyIncomeLimit,
            _hasMonthlyIncomeLimit,
            _hasDailyOutcomeLimit,
            _hasMonthlyOutcomeLimit
        );

        emit TokenLimitStatusUpdated(
            _token,
            _hasDailyIncomeLimit,
            _hasMonthlyIncomeLimit,
            _hasDailyOutcomeLimit,
            _hasMonthlyOutcomeLimit
        );
    }

    /**
     * @param _token token contract address
     * @param _users list of user addresses
     */
    function usersFromListIsBlocked(
        address _token,
        address[] memory _users
    ) external view returns (address[] memory list) {
        uint256 length = 0;

        for (uint256 i; i < _users.length; i++) {
            bool hasMatch = _token == address(0)
                ? globalBlockList[_users[i]]
                : internalBlockList[_token][_users[i]] ||
                    globalBlockList[_users[i]];
            if (hasMatch) {
                length += 1;
            }
        }

        list = new address[](length);

        if (length == 0) {
            return list;
        }

        uint256 listCounter = 0;

        for (uint256 i; i < _users.length; i++) {
            bool hasMatch = _token == address(0)
                ? globalBlockList[_users[i]]
                : internalBlockList[_token][_users[i]] ||
                    globalBlockList[_users[i]];
            if (hasMatch) {
                list[listCounter] = _users[i];
                listCounter++;
            }
        }

        return list;
    }

    /**
     * @param _sender transaction sender address
     * @param _from token sender address
     * @param _to recipient address
     */
    function userIsBlocked(
        address _sender,
        address _from,
        address _to
    ) external view returns (bool) {
        return
            globalBlockList[_sender] ||
            globalBlockList[_from] ||
            globalBlockList[_to];
    }

    /**
     * @param _token token contract address
     * @param _sender transaction sender address
     * @param _from token sender address
     * @param _to recipient address
     */
    function userIsInternalBlocked(
        address _token,
        address _sender,
        address _from,
        address _to
    ) external view returns (bool) {
        mapping(address => bool)
            storage tokenInternalBlockList = internalBlockList[_token];

        return
            tokenInternalBlockList[_sender] ||
            tokenInternalBlockList[_from] ||
            tokenInternalBlockList[_to];
    }

    /**
     * @notice Get current day
     */
    function getCurrentDay() public view returns (uint256) {
        (uint256 year, uint256 month, uint256 day) = _timestampToDate(
            block.timestamp
        );
        return year * 10_000 + month * 100 + day;
    }

    /**
     * @notice Get current month
     */
    function getCurrentMonth() public view returns (uint256) {
        (uint256 year, uint256 month, ) = _timestampToDate(block.timestamp);

        return year * 100 + month;
    }

    /**
     * @param _token token contract address
     */
    function getTokenLimits(
        address _token
    ) external view returns (TokenLimit memory) {
        return tokenLimits[_token];
    }

    /**
     * @param _token token contract address
     * @param _user user address
     */
    function getUserTokenTransfers(
        address _token,
        address _user
    )
        public
        view
        returns (
            uint256 dailyIncomeTransfers,
            uint256 monthlyIncomeTransfers,
            uint256 dailyOutcomeTransfers,
            uint256 monthlyOutcomeTransfers
        )
    {
        uint256 currentMonth = getCurrentMonth();
        uint256 currentDay = getCurrentDay();

        TokenTransfers memory _day = tokenTransfers[_token][_user][currentDay];
        TokenTransfers memory _month = tokenTransfers[_token][_user][currentMonth];

        dailyIncomeTransfers = uint256(_day.income);
        monthlyIncomeTransfers = uint256(_month.income);
        dailyOutcomeTransfers = uint256(_day.outcome);
        monthlyOutcomeTransfers = uint256(_month.outcome);
    }

    /**
     * @param _token token contract address
     * @param _user user address
     */
    function getUserRemainingLimit(
        address _token,
        address _user
    )
        external
        view
        returns (
            uint256 dailyIncomeRemaining,
            uint256 monthlyIncomeRemaining,
            uint256 dailyOutcomeRemaining,
            uint256 monthlyOutcomeRemaining
        )
    {
        (
            uint256 dailyIncomeTransfers,
            uint256 monthlyIncomeTransfers,
            uint256 dailyOutcomeTransfers,
            uint256 monthlyOutcomeTransfers
        ) = getUserTokenTransfers(_token, _user);

        TokenLimit memory limits = tokenLimits[_token];

        if (dailyIncomeTransfers >= limits.dailyIncome) {
            dailyIncomeRemaining = 0;
        } else {
            dailyIncomeRemaining = limits.dailyIncome - dailyIncomeTransfers;
        }

        if (monthlyIncomeTransfers >= limits.monthlyIncome) {
            monthlyIncomeRemaining = 0;
        } else {
            monthlyIncomeRemaining = limits.monthlyIncome - monthlyIncomeTransfers;
        }

        if (dailyOutcomeTransfers >= limits.dailyOutcome) {
            dailyOutcomeRemaining = 0;
        } else {
            dailyOutcomeRemaining = limits.dailyOutcome - dailyOutcomeTransfers;
        }
        
        if (monthlyOutcomeTransfers >= limits.monthlyOutcome) {
            monthlyOutcomeRemaining = 0;
        } else {
            monthlyOutcomeRemaining = limits.monthlyOutcome - monthlyOutcomeTransfers;
        }
    }

    /**
     * @notice Convert timestamp to date
     * @param _timestamp Timestamp
     *
     */
    function _timestampToDate(
        uint256 _timestamp
    ) internal pure returns (uint256 year, uint256 month, uint256 day) {
        unchecked {
            uint256 daysSinceEpoch = _timestamp / 86400;
            
            uint256 a = daysSinceEpoch + 2440588 + 32044;
            uint256 b = (4 * a + 3) / 146097;
            uint256 c = a - (146097 * b) / 4;
            uint256 d = (4 * c + 3) / 1461;
            uint256 e = c - (1461 * d) / 4;
            uint256 m = (5 * e + 2) / 153;
            
            day = e - (153 * m + 2) / 5 + 1;
            month = m + 3 - 12 * (m / 10);
            year = 100 * b + d - 4800 + (m / 10);
        }
    }
}
