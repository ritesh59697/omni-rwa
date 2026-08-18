const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const config = JSON.parse(fs.readFileSync("frontend/contracts_config.json", "utf8"));
  const aiController = await hre.ethers.getContractAt("AiStrategyController", config.contracts.AiStrategyController);
  
  console.log("Setting testnet guardrails: cooldown = 0s for seamless testing...");
  // minTreasuryBps = 2000 (20%), maxRiskScore = 85, cooldown = 0 seconds
  const tx = await aiController.setGuardrails(2000, 85, 0);
  console.log("Tx:", tx.hash);
  await tx.wait();
  console.log("Guardrails updated on BOT Chain Testnet!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
