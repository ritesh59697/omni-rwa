// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OmniRwaVault.sol";

/**
 * @title RwaRestakingManager
 * @dev Restaking protocol for OmniRWA vault shares on BOT Chain.
 * Users restake `omniRWA` shares to earn boosted RWA yields and native ecosystem reward points.
 */
contract RwaRestakingManager is Ownable {
    using SafeERC20 for IERC20;

    OmniRwaVault public vaultToken;

    struct StakePosition {
        uint256 amount;
        uint256 lockDuration; // in seconds (0 = flexible)
        uint256 startTime;
        uint256 unlockTime;
        uint256 rewardMultiplierBps; // 10000 = 1.0x, 15000 = 1.5x, 20000 = 2.0x
        uint256 pointsAccrued;
        uint256 lastClaimTimestamp;
    }

    // User address => array of stake positions
    mapping(address => StakePosition[]) public userPositions;
    
    uint256 public totalSharesRestaked;
    uint256 public totalRewardPointsDistributed;

    event SharesRestaked(
        address indexed user,
        uint256 indexed positionIndex,
        uint256 amount,
        uint256 lockDuration,
        uint256 multiplierBps
    );
    event SharesUnstaked(address indexed user, uint256 indexed positionIndex, uint256 amount);
    event RewardClaimed(address indexed user, uint256 indexed positionIndex, uint256 points);

    constructor(OmniRwaVault vaultToken_) Ownable(msg.sender) {
        vaultToken = vaultToken_;
    }

    /**
     * @notice Get all stake positions of a user
     */
    function getUserPositions(address user) external view returns (StakePosition[] memory) {
        return userPositions[user];
    }

    /**
     * @notice Restake omniRWA vault shares with selected lock tier
     * @param amount Amount of omniRWA shares to restake
     * @param lockTier 0: Flexible (1.0x), 1: 30-Day (1.25x), 2: 90-Day (1.5x), 3: 180-Day (2.0x)
     */
    function restake(uint256 amount, uint8 lockTier) external {
        require(amount > 0, "Amount must be > 0");

        uint256 lockDuration;
        uint256 multiplierBps;

        if (lockTier == 0) {
            lockDuration = 0;
            multiplierBps = 10000; // 1.0x
        } else if (lockTier == 1) {
            lockDuration = 30 days;
            multiplierBps = 12500; // 1.25x
        } else if (lockTier == 2) {
            lockDuration = 90 days;
            multiplierBps = 15000; // 1.5x
        } else if (lockTier == 3) {
            lockDuration = 180 days;
            multiplierBps = 20000; // 2.0x
        } else {
            revert("Invalid lock tier");
        }

        IERC20(address(vaultToken)).safeTransferFrom(msg.sender, address(this), amount);

        userPositions[msg.sender].push(StakePosition({
            amount: amount,
            lockDuration: lockDuration,
            startTime: block.timestamp,
            unlockTime: block.timestamp + lockDuration,
            rewardMultiplierBps: multiplierBps,
            pointsAccrued: 0,
            lastClaimTimestamp: block.timestamp
        }));

        totalSharesRestaked += amount;
        uint256 posIndex = userPositions[msg.sender].length - 1;

        emit SharesRestaked(msg.sender, posIndex, amount, lockDuration, multiplierBps);
    }

    /**
     * @notice Calculate pending restake reward points for a position
     */
    function calculatePendingPoints(address user, uint256 positionIndex) public view returns (uint256) {
        require(positionIndex < userPositions[user].length, "Invalid position");
        StakePosition memory pos = userPositions[user][positionIndex];
        if (pos.amount == 0) return 0;

        uint256 elapsed = block.timestamp - pos.lastClaimTimestamp;
        // Points = (amount * multiplierBps * elapsed) / (10000 * 1 days)
        return (pos.amount * pos.rewardMultiplierBps * elapsed) / (10000 * 1 days);
    }

    /**
     * @notice Claim accrued restaking reward points
     */
    function claimRewards(uint256 positionIndex) public {
        uint256 pending = calculatePendingPoints(msg.sender, positionIndex);
        require(pending > 0, "No pending points");

        userPositions[msg.sender][positionIndex].pointsAccrued += pending;
        userPositions[msg.sender][positionIndex].lastClaimTimestamp = block.timestamp;
        totalRewardPointsDistributed += pending;

        emit RewardClaimed(msg.sender, positionIndex, pending);
    }

    /**
     * @notice Unstake shares once lock period expires
     */
    function unstake(uint256 positionIndex) external {
        require(positionIndex < userPositions[msg.sender].length, "Invalid position");
        StakePosition storage pos = userPositions[msg.sender][positionIndex];
        require(pos.amount > 0, "Already unstaked");
        require(block.timestamp >= pos.unlockTime, "Position still locked");

        // Auto-claim any remaining rewards
        uint256 pending = calculatePendingPoints(msg.sender, positionIndex);
        if (pending > 0) {
            pos.pointsAccrued += pending;
            totalRewardPointsDistributed += pending;
            emit RewardClaimed(msg.sender, positionIndex, pending);
        }

        uint256 unstakeAmount = pos.amount;
        pos.amount = 0;
        totalSharesRestaked -= unstakeAmount;

        IERC20(address(vaultToken)).safeTransfer(msg.sender, unstakeAmount);

        emit SharesUnstaked(msg.sender, positionIndex, unstakeAmount);
    }
}
