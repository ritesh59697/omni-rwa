const hre = require("hardhat");

async function main() {
  const provider = hre.ethers.provider;
  const deployer = "0x780541Ffca8315f6c943019947ACf33c108444eF";
  
  console.log(`Scanning transactions for deployer: ${deployer} on BOT Chain Mainnet...`);
  
  const latestBlock = await provider.getBlockNumber();
  console.log("Latest Block:", latestBlock);
  
  // Hardhat's provider doesn't support block search directly for large ranges easily on some RPCs
  // but we can query block-by-block going backward for 30,000 blocks (roughly 1 day).
  const startBlock = Math.max(0, latestBlock - 40000);
  
  let found = 0;
  for (let i = latestBlock; i >= startBlock; i--) {
    const block = await provider.getBlock(i, true);
    if (!block || !block.transactions) continue;
    
    for (const txHash of block.transactions) {
      const tx = await provider.getTransaction(txHash);
      if (tx && tx.from && tx.from.toLowerCase() === deployer.toLowerCase()) {
        console.log(`Block ${i} | Tx: ${tx.hash} | To: ${tx.to || "Contract Creation"} | Nonce: ${tx.nonce}`);
        found++;
        if (found >= 15) {
          return;
        }
      }
    }
  }
  console.log(`Scan complete. Found ${found} transactions.`);
}

main().catch(console.error);
