const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OmniRWA Protocol Tests on BOT Chain", function () {
  let owner, user1, user2, aiAgent;
  let usdt, bustb, breit, bgreen, vault, aiController, restaking;

  const INITIAL_USDT = ethers.parseUnits("10000", 6);

  beforeEach(async function () {
    [owner, user1, user2, aiAgent] = await ethers.getSigners();

    // 1. Deploy MockUSDT
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdt = await MockUSDT.deploy();
    await usdt.waitForDeployment();

    // 2. Deploy RWA Asset Tokens
    const RwaAssetToken = await ethers.getContractFactory("RwaAssetToken");
    // bUSTB (US Treasuries, 5.2% APY = 520 bps)
    bustb = await RwaAssetToken.deploy(
      "BOT Tokenized US Treasury 3M",
      "bUSTB",
      6,
      520,
      1000000,
      "US_TREASURY",
      "ipfs://QmTreasuryAttestation2026"
    );
    await bustb.waitForDeployment();

    // bREIT (Commercial Real Estate Debt, 8.7% APY = 870 bps)
    breit = await RwaAssetToken.deploy(
      "BOT Commercial Real Estate Debt",
      "bREIT",
      6,
      870,
      1000000,
      "REAL_ESTATE_DEBT",
      "ipfs://QmRealEstateAttestation2026"
    );
    await breit.waitForDeployment();

    // bGREEN (Green Infrastructure Bonds, 11.4% APY = 1140 bps)
    bgreen = await RwaAssetToken.deploy(
      "BOT Green Energy Infrastructure Bond",
      "bGREEN",
      6,
      1140,
      1000000,
      "GREEN_BONDS",
      "ipfs://QmGreenBondAttestation2026"
    );
    await bgreen.waitForDeployment();

    // 3. Deploy OmniRwaVault
    const OmniRwaVault = await ethers.getContractFactory("OmniRwaVault");
    vault = await OmniRwaVault.deploy(
      await usdt.getAddress(),
      "OmniRWA Yield-Bearing Share",
      "omniRWA",
      owner.address
    );
    await vault.waitForDeployment();

    // 4. Add Strategies to Vault
    // Initial allocation: 50% bUSTB, 30% bREIT, 20% bGREEN
    await vault.addStrategy(await bustb.getAddress(), 5000);
    await vault.addStrategy(await breit.getAddress(), 3000);
    await vault.addStrategy(await bgreen.getAddress(), 2000);

    // 5. Deploy AiStrategyController
    const AiStrategyController = await ethers.getContractFactory("AiStrategyController");
    aiController = await AiStrategyController.deploy(await vault.getAddress());
    await aiController.waitForDeployment();

    // Authorize AI Controller on Vault and set agent address
    await vault.setAiController(await aiController.getAddress());
    await aiController.setAgentExecutor(aiAgent.address, true);

    // 6. Deploy RwaRestakingManager
    const RwaRestakingManager = await ethers.getContractFactory("RwaRestakingManager");
    restaking = await RwaRestakingManager.deploy(await vault.getAddress());
    await restaking.waitForDeployment();

    // Transfer test funds to user1 and user2
    await usdt.transfer(user1.address, INITIAL_USDT);
    await usdt.transfer(user2.address, INITIAL_USDT);
  });

  describe("1. Faucet & Basic Setup", function () {
    it("Should allow users to claim USDT from the faucet", async function () {
      const claimer = user2;
      const balanceBefore = await usdt.balanceOf(claimer.address);
      // Fast forward time slightly to ensure faucet is ready
      await usdt.connect(claimer).faucet();
      const balanceAfter = await usdt.balanceOf(claimer.address);
      expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("10000", 6));
    });

    it("Should correctly compute initial weighted APY", async function () {
      // 50% * 5.2% (520) + 30% * 8.7% (870) + 20% * 11.4% (1140)
      // = 260 + 261 + 228 = 749 bps (7.49% APY)
      const apyBps = await vault.getWeightedApyBps();
      expect(apyBps).to.equal(749n);
    });
  });

  describe("2. ERC-4626 Vault Deposits & Withdrawals", function () {
    it("Should allow user to deposit USDT and receive omniRWA shares", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      const shares = await vault.balanceOf(user1.address);
      expect(shares).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("Should allow user to withdraw deposited assets", async function () {
      const depositAmount = ethers.parseUnits("2000", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      await vault.connect(user1).withdraw(depositAmount, user1.address, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(0n);
      expect(await usdt.balanceOf(user1.address)).to.equal(INITIAL_USDT);
    });
  });

  describe("3. Autonomous AI Strategy Controller & Rebalancing", function () {
    it("Should allow AI agent to execute rebalance with on-chain proof logging", async function () {
      const depositAmount = ethers.parseUnits("5000", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Fast forward past cooldown
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine");

      // AI shifts to Defensive Yield: 60% bUSTB, 25% bREIT, 15% bGREEN
      const newWeights = [6000, 2500, 1500];
      const modelVersion = "Gemini-3.7-Flash-RWA-Risk-Engine";
      const riskScore = 35; // Safe
      const predictedApy = 685; // 6.85%
      const rationale = "Macro volatility detected in commercial credit. Increasing allocation to 3M US Treasuries.";
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes(rationale + Date.now().toString()));

      await expect(
        aiController.connect(aiAgent).executeAiRebalance(
          modelVersion,
          riskScore,
          predictedApy,
          newWeights,
          rationale,
          proofHash
        )
      ).to.emit(aiController, "AiRebalanceExecuted");

      // Verify recorded decision
      expect(await aiController.totalDecisions()).to.equal(1n);
      const decision = await aiController.getDecision(0);
      expect(decision.aiModelVersion).to.equal(modelVersion);
      expect(decision.compositeRiskScore).to.equal(35n);
      expect(decision.rationale).to.equal(rationale);

      // Verify updated weighted APY: 60%*520 + 25%*870 + 15%*1140 = 312 + 217.5 + 171 = 700.5 -> 700 bps
      const newApy = await vault.getWeightedApyBps();
      expect(newApy).to.equal(700n);
    });

    it("Should enforce safety guardrails (reject high risk or insufficient treasury allocation)", async function () {
      await ethers.provider.send("evm_increaseTime", [400]);
      await ethers.provider.send("evm_mine");

      // Attempt unsafe rebalance: Only 10% Treasury (min is 20%)
      const unsafeWeights = [1000, 4000, 5000];
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("Unsafe rebalance test"));

      await expect(
        aiController.connect(aiAgent).executeAiRebalance(
          "Unsafe-AI",
          30,
          900,
          unsafeWeights,
          "Over-allocating to high risk assets",
          proofHash
        )
      ).to.be.revertedWith("AiController: US Treasury allocation below minimum safety threshold");
    });
  });

  describe("4. RWA Restaking & Boosted Yields", function () {
    it("Should allow user to restake omniRWA shares and earn reward points", async function () {
      const depositAmount = ethers.parseUnits("3000", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Approve and restake 2000 shares in 90-Day tier (Tier 2 = 1.5x multiplier)
      const restakeAmount = ethers.parseUnits("2000", 6);
      await vault.connect(user1).approve(await restaking.getAddress(), restakeAmount);
      await restaking.connect(user1).restake(restakeAmount, 2);

      const positions = await restaking.getUserPositions(user1.address);
      expect(positions.length).to.equal(1);
      expect(positions[0].amount).to.equal(restakeAmount);
      expect(positions[0].rewardMultiplierBps).to.equal(15000n); // 1.5x

      // Advance time by 30 days
      await ethers.provider.send("evm_increaseTime", [30 * 24 * 3600]);
      await ethers.provider.send("evm_mine");

      const pendingPoints = await restaking.calculatePendingPoints(user1.address, 0);
      expect(pendingPoints).to.be.gt(0n);

      await restaking.connect(user1).claimRewards(0);
      const updatedPositions = await restaking.getUserPositions(user1.address);
      expect(updatedPositions[0].pointsAccrued).to.be.gt(0n);
    });

    it("Should unlock and allow unstake after lock duration", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await usdt.connect(user1).approve(await vault.getAddress(), depositAmount);
      await vault.connect(user1).deposit(depositAmount, user1.address);

      // Flexible restake (Tier 0)
      await vault.connect(user1).approve(await restaking.getAddress(), depositAmount);
      await restaking.connect(user1).restake(depositAmount, 0);

      // Unstake immediately allowed for flexible tier
      await restaking.connect(user1).unstake(0);
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
    });
  });
});
