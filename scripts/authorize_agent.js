const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const config = JSON.parse(fs.readFileSync("frontend/contracts_config.json", "utf8"));
  const userAddr = hre.ethers.getAddress("0x780541ffca8315f6c943019947ACf33c108444eF".toLowerCase());
  
  console.log("Connecting to AiStrategyController at:", config.contracts.AiStrategyController);
  const [deployer] = await hre.ethers.getSigners();
  console.log("Signer:", deployer.address);

  const aiController = await hre.ethers.getContractAt("AiStrategyController", config.contracts.AiStrategyController);
  const owner = await aiController.owner();
  console.log("Contract Owner:", owner);

  const isAuth = await aiController.isAgentExecutor(userAddr);
  console.log(`Is ${userAddr} authorized:`, isAuth);

  if (!isAuth) {
    console.log(`Authorizing ${userAddr} as agent executor...`);
    const tx = await aiController.setAgentExecutor(userAddr, true);
    console.log("Transaction submitted:", tx.hash);
    await tx.wait();
    console.log("Successfully authorized!");
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
