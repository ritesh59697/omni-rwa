// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./OmniRwaVault.sol";

/**
 * @title AiStrategyController
 * @dev Autonomous On-Chain AI Agent Controller for OmniRWA.
 * Stores verifiable AI decision proofs, enforces safety guardrails,
 * and executes dynamic capital rebalancing on BOT Chain.
 */
contract AiStrategyController is Ownable {
    OmniRwaVault public vault;

    struct AiDecisionRecord {
        uint256 timestamp;
        string aiModelVersion; // e.g. "Gemini-3.7-Flash-Financial-v2"
        uint256 compositeRiskScore; // 0 (safest) to 100 (highest risk)
        uint256 predictedBlendedApy; // basis points
        string rationale;
        bytes32 proofHash;
        uint256[] targetWeights;
    }

    AiDecisionRecord[] public decisionHistory;
    
    // Whitelisted AI agent executor addresses
    mapping(address => bool) public isAgentExecutor;

    // Safety guardrails
    uint256 public minTreasuryWeightBps = 2000; // Minimum 20.00% allocated to risk-free US Treasuries
    uint256 public maxRiskToleranceScore = 80;  // Max risk threshold for automated execution
    uint256 public minCooldownBetweenRebalances = 5 minutes;
    uint256 public lastRebalanceTimestamp;

    event AgentExecutorUpdated(address indexed agent, bool authorized);
    event SafetyGuardrailsUpdated(uint256 minTreasuryBps, uint256 maxRiskScore, uint256 cooldown);
    event AiRebalanceExecuted(
        uint256 indexed decisionIndex,
        string modelVersion,
        uint256 riskScore,
        uint256 predictedApy,
        string rationale,
        bytes32 proofHash
    );

    modifier onlyAgentOrOwner() {
        require(isAgentExecutor[msg.sender] || msg.sender == owner(), "AiController: Unauthorized");
        _;
    }

    constructor(OmniRwaVault vault_) Ownable(msg.sender) {
        vault = vault_;
        isAgentExecutor[msg.sender] = true;
    }

    function setAgentExecutor(address agent, bool authorized) external onlyOwner {
        isAgentExecutor[agent] = authorized;
        emit AgentExecutorUpdated(agent, authorized);
    }

    function setGuardrails(
        uint256 minTreasuryBps_,
        uint256 maxRiskScore_,
        uint256 cooldown_
    ) external onlyOwner {
        minTreasuryWeightBps = minTreasuryBps_;
        maxRiskToleranceScore = maxRiskScore_;
        minCooldownBetweenRebalances = cooldown_;
        emit SafetyGuardrailsUpdated(minTreasuryBps_, maxRiskScore_, cooldown_);
    }

    /**
     * @notice Number of recorded AI decisions
     */
    function totalDecisions() external view returns (uint256) {
        return decisionHistory.length;
    }

    /**
     * @notice Get full details of a specific AI decision record
     */
    function getDecision(uint256 index) external view returns (AiDecisionRecord memory) {
        require(index < decisionHistory.length, "Invalid index");
        return decisionHistory[index];
    }

    /**
     * @notice Autonomous AI execution entrypoint
     * Enforces safety guardrails before committing changes to the vault.
     */
    function executeAiRebalance(
        string calldata modelVersion,
        uint256 riskScore,
        uint256 predictedApy,
        uint256[] calldata newWeights,
        string calldata rationale,
        bytes32 proofHash
    ) external onlyAgentOrOwner {
        require(
            block.timestamp >= lastRebalanceTimestamp + minCooldownBetweenRebalances,
            "AiController: Cooldown active"
        );
        require(riskScore <= maxRiskToleranceScore, "AiController: Risk score exceeds safety limit");
        require(newWeights.length > 0 && newWeights[0] >= minTreasuryWeightBps, "AiController: US Treasury allocation below minimum safety threshold");

        lastRebalanceTimestamp = block.timestamp;

        // Record decision proof
        decisionHistory.push(AiDecisionRecord({
            timestamp: block.timestamp,
            aiModelVersion: modelVersion,
            compositeRiskScore: riskScore,
            predictedBlendedApy: predictedApy,
            rationale: rationale,
            proofHash: proofHash,
            targetWeights: newWeights
        }));

        uint256 decisionIndex = decisionHistory.length - 1;

        // Execute rebalance on the Vault
        vault.rebalance(newWeights, rationale, proofHash);

        emit AiRebalanceExecuted(
            decisionIndex,
            modelVersion,
            riskScore,
            predictedApy,
            rationale,
            proofHash
        );
    }
}
