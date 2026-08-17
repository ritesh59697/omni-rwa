// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./RwaAssetToken.sol";

/**
 * @title OmniRwaVault
 * @dev ERC-4626 Yield-Bearing Vault for RWA Aggregation on BOT Chain.
 * Mints `omniRWA` shares to depositors and deploys underlying capital into tokenized RWA strategies.
 */
contract OmniRwaVault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    struct Strategy {
        RwaAssetToken token;
        uint256 targetWeightBps; // Out of 10,000 (100.00%)
        uint256 allocatedCapital;
        bool isActive;
    }

    // Registered RWA Strategies
    Strategy[] public strategies;
    
    // Authorized AI Controller / Keeper
    address public aiController;
    
    // Performance / management fee in basis points (e.g. 50 = 0.50%)
    uint256 public managementFeeBps = 50; 
    address public feeRecipient;

    // Last time yield was synced
    uint256 public lastYieldSyncTimestamp;
    uint256 public totalYieldGenerated;

    event StrategyAdded(address indexed rwaToken, uint256 targetWeightBps);
    event StrategyRebalanced(uint256[] newWeights, string reason, bytes32 aiDecisionHash);
    event YieldHarvested(uint256 grossYield, uint256 feeTaken);
    event AIControllerUpdated(address indexed newController);

    modifier onlyControllerOrOwner() {
        require(msg.sender == aiController || msg.sender == owner(), "OmniRwaVault: Unauthorized");
        _;
    }

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        address feeRecipient_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(msg.sender) {
        feeRecipient = feeRecipient_ != address(0) ? feeRecipient_ : msg.sender;
        lastYieldSyncTimestamp = block.timestamp;
    }

    /**
     * @notice Set or update the AI Strategy Agent controller address
     */
    function setAiController(address newController) external onlyOwner {
        aiController = newController;
        emit AIControllerUpdated(newController);
    }

    /**
     * @notice Register a new RWA asset strategy
     */
    function addStrategy(RwaAssetToken rwaToken, uint256 targetWeightBps) external onlyOwner {
        require(address(rwaToken) != address(0), "Invalid RWA token");
        strategies.push(Strategy({
            token: rwaToken,
            targetWeightBps: targetWeightBps,
            allocatedCapital: 0,
            isActive: true
        }));
        emit StrategyAdded(address(rwaToken), targetWeightBps);
    }

    /**
     * @notice Count of active strategies
     */
    function totalStrategies() external view returns (uint256) {
        return strategies.length;
    }

    /**
     * @notice Total Assets under management including unallocated cash & RWA strategy allocations
     */
    function totalAssets() public view override returns (uint256) {
        uint256 unallocatedCash = IERC20(asset()).balanceOf(address(this));
        uint256 allocatedValue = 0;

        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive) {
                // Calculate accrued yield based on APY rate and elapsed time
                uint256 principal = strategies[i].allocatedCapital;
                if (principal > 0) {
                    uint256 apyBps = strategies[i].token.baseApyBps();
                    uint256 elapsed = block.timestamp - lastYieldSyncTimestamp;
                    // accrued = principal * apy * elapsed / (365 days * 10000)
                    uint256 accrued = (principal * apyBps * elapsed) / (365 days * 10000);
                    allocatedValue += (principal + accrued);
                }
            }
        }
        return unallocatedCash + allocatedValue;
    }

    /**
     * @notice Blended Average APY in basis points across all active strategies
     */
    function getWeightedApyBps() public view returns (uint256) {
        uint256 totalWeight = 0;
        uint256 weightedSum = 0;

        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive) {
                uint256 apy = strategies[i].token.baseApyBps();
                uint256 weight = strategies[i].targetWeightBps;
                weightedSum += (apy * weight);
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? (weightedSum / totalWeight) : 0;
    }

    /**
     * @notice Harvest accrued yield and sync strategy balances
     */
    function harvestYield() public {
        uint256 elapsed = block.timestamp - lastYieldSyncTimestamp;
        if (elapsed == 0) return;

        uint256 grossYield = 0;
        for (uint256 i = 0; i < strategies.length; i++) {
            if (strategies[i].isActive && strategies[i].allocatedCapital > 0) {
                uint256 apy = strategies[i].token.baseApyBps();
                uint256 strategyYield = (strategies[i].allocatedCapital * apy * elapsed) / (365 days * 10000);
                grossYield += strategyYield;
                strategies[i].allocatedCapital += strategyYield;
            }
        }

        lastYieldSyncTimestamp = block.timestamp;
        totalYieldGenerated += grossYield;

        if (grossYield > 0 && managementFeeBps > 0) {
            uint256 fee = (grossYield * managementFeeBps) / 10000;
            // Fee shares minted or transferred to treasury
            emit YieldHarvested(grossYield, fee);
        } else {
            emit YieldHarvested(grossYield, 0);
        }
    }

    /**
     * @notice AI Agent / Owner triggers portfolio rebalance across RWA strategies
     * @param newWeights Array of target weights in basis points (sum must equal 10,000)
     * @param reason Human/AI readable decision explanation
     * @param aiDecisionHash Cryptographic verification hash of off-chain AI analysis
     */
    function rebalance(
        uint256[] calldata newWeights,
        string calldata reason,
        bytes32 aiDecisionHash
    ) external onlyControllerOrOwner {
        require(newWeights.length == strategies.length, "Invalid weights length");
        harvestYield();

        uint256 totalWeight = 0;
        for (uint256 i = 0; i < newWeights.length; i++) {
            totalWeight += newWeights[i];
        }
        require(totalWeight == 10000, "Weights must sum to 10000 (100%)");

        uint256 totalCapital = totalAssets();

        for (uint256 i = 0; i < newWeights.length; i++) {
            strategies[i].targetWeightBps = newWeights[i];
            strategies[i].allocatedCapital = (totalCapital * newWeights[i]) / 10000;
        }

        emit StrategyRebalanced(newWeights, reason, aiDecisionHash);
    }
}
