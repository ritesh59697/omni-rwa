const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = await hre.ethers.provider.getNetwork();

  console.log("==================================================");
  console.log("🚀 Deploying OmniRWA Protocol to BOT Chain");
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer Address: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer Balance: ${hre.ethers.formatEther(balance)} BOT`);
  console.log("==================================================\n");

  // 1. Deploy MockUSDT
  console.log("1️⃣ Deploying MockUSDT...");
  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const usdt = await MockUSDT.deploy();
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log(`✅ MockUSDT Deployed at: ${usdtAddress}`);

  // 2. Deploy RWA Asset Tokens
  console.log("\n2️⃣ Deploying Tokenized RWA Assets...");
  const RwaAssetToken = await hre.ethers.getContractFactory("RwaAssetToken");

  // bUSTB: US Treasury 3-Month Bills (5.20% APY)
  const bustb = await RwaAssetToken.deploy(
    "BOT Tokenized US Treasury 3M",
    "bUSTB",
    6,
    520, // 5.20% APY
    1000000,
    "US_TREASURY",
    "ipfs://QmTreasuryAttestation2026"
  );
  await bustb.waitForDeployment();
  const bustbAddress = await bustb.getAddress();
  console.log(`✅ bUSTB (US Treasury 5.2% APY) Deployed at: ${bustbAddress}`);

  // bREIT: Commercial Real Estate Debt (8.70% APY)
  const breit = await RwaAssetToken.deploy(
    "BOT Commercial Real Estate Debt",
    "bREIT",
    6,
    870, // 8.70% APY
    1000000,
    "REAL_ESTATE_DEBT",
    "ipfs://QmRealEstateAttestation2026"
  );
  await breit.waitForDeployment();
  const breitAddress = await breit.getAddress();
  console.log(`✅ bREIT (Commercial Real Estate 8.7% APY) Deployed at: ${breitAddress}`);

  // bGREEN: Green Energy Infrastructure Bonds (11.40% APY)
  const bgreen = await RwaAssetToken.deploy(
    "BOT Green Energy Infrastructure Bond",
    "bGREEN",
    6,
    1140, // 11.40% APY
    1000000,
    "GREEN_BONDS",
    "ipfs://QmGreenBondAttestation2026"
  );
  await bgreen.waitForDeployment();
  const bgreenAddress = await bgreen.getAddress();
  console.log(`✅ bGREEN (Green Energy Bonds 11.4% APY) Deployed at: ${bgreenAddress}`);

  // 3. Deploy OmniRwaVault
  console.log("\n3️⃣ Deploying OmniRwaVault (ERC-4626)...");
  const OmniRwaVault = await hre.ethers.getContractFactory("OmniRwaVault");
  const vault = await OmniRwaVault.deploy(
    usdtAddress,
    "OmniRWA Yield-Bearing Share",
    "omniRWA",
    deployer.address
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`✅ OmniRwaVault Deployed at: ${vaultAddress}`);

  // 4. Register Strategies on Vault
  console.log("\n4️⃣ Registering RWA Strategies in Vault...");
  // Initial target allocation: 50% bUSTB (5000 bps), 30% bREIT (3000 bps), 20% bGREEN (2000 bps)
  await (await vault.addStrategy(bustbAddress, 5000)).wait();
  await (await vault.addStrategy(breitAddress, 3000)).wait();
  await (await vault.addStrategy(bgreenAddress, 2000)).wait();
  console.log("✅ Initial RWA Strategies registered: [50% bUSTB, 30% bREIT, 20% bGREEN]");

  // 5. Deploy AiStrategyController
  console.log("\n5️⃣ Deploying AiStrategyController (Autonomous AI Agent Engine)...");
  const AiStrategyController = await hre.ethers.getContractFactory("AiStrategyController");
  const aiController = await AiStrategyController.deploy(vaultAddress);
  await aiController.waitForDeployment();
  const aiControllerAddress = await aiController.getAddress();
  console.log(`✅ AiStrategyController Deployed at: ${aiControllerAddress}`);

  // Link AI Controller to Vault
  await (await vault.setAiController(aiControllerAddress)).wait();
  console.log("✅ AI Controller authorized on OmniRwaVault");

  // 6. Deploy RwaRestakingManager
  console.log("\n6️⃣ Deploying RwaRestakingManager...");
  const RwaRestakingManager = await hre.ethers.getContractFactory("RwaRestakingManager");
  const restaking = await RwaRestakingManager.deploy(vaultAddress);
  await restaking.waitForDeployment();
  const restakingAddress = await restaking.getAddress();
  console.log(`✅ RwaRestakingManager Deployed at: ${restakingAddress}`);

  // Export Deployed Addresses and Contract ABIs for Frontend
  const deploymentData = {
    network: network.name,
    chainId: Number(network.chainId),
    deployedAt: new Date().toISOString(),
    contracts: {
      MockUSDT: usdtAddress,
      bUSTB: bustbAddress,
      bREIT: breitAddress,
      bGREEN: bgreenAddress,
      OmniRwaVault: vaultAddress,
      AiStrategyController: aiControllerAddress,
      RwaRestakingManager: restakingAddress,
    },
  };

  const outputPath = path.join(__dirname, "../frontend/contracts_config.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log(`\n📄 Deployment configuration saved to: ${outputPath}`);

  console.log("\n==================================================");
  console.log("🎉 OmniRWA Protocol Deployment Complete!");
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
