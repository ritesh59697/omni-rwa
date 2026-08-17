# 🏆 OmniRWA — BOT Chain Builder Challenge #2 Submission Kit

> **Project Name:** OmniRWA  
> **Tagline:** Autonomous AI-Managed RWA Restaking & Yield Aggregator on BOT Chain  
> **Challenge Tracks:** 🏆 **RWA Applications** (Primary) & 🤖 **AI Native Applications** (Secondary)  
> **GitHub Repository:** `https://github.com/your-username/omni-rwa` *(Replace with your GitHub repo URL)*  
> **Demo URL:** `https://omni-rwa.vercel.app` *(or local/preview URL)*  

---

## 📌 Executive Summary & Pitch
**OmniRWA** is an institutional-grade decentralized yield aggregator and restaking protocol native to **BOT Chain**. 

Tokenized Real-World Assets (Treasuries, Private Credit, Infrastructure) suffer from static allocations, slow off-chain rebalancing, and fragmented yields. **OmniRWA** solves this by pairing an **ERC-4626 standard Vault (`omniRWA`)** with an **autonomous on-chain AI Strategy Controller**. 

1. Users deposit stablecoins (USDT) to mint yield-bearing `omniRWA` shares.
2. The **AI Risk & Strategy Agent** evaluates macroeconomic yield curves, counterparty credit ratings, and default probabilities in real time.
3. The AI agent executes **verifiable on-chain capital rebalancing** on BOT Chain while logging cryptographic decision proofs directly to the blockchain.
4. Depositors can **restake `omniRWA` shares** in flexible or locked tiers (up to 2.0x boost) to earn compounded RWA yields and native BOT ecosystem reward points.

---

## 🏛️ Smart Contract Architecture on BOT Chain

| Contract | Description | Standard |
| :--- | :--- | :--- |
| **`OmniRwaVault.sol`** | Core yield-bearing vault managing deposits, share pricing, yield distribution, and multi-strategy RWA allocations. | ERC-4626 / ERC-20 |
| **`AiStrategyController.sol`** | Autonomous AI agent execution engine. Enforces risk guardrails, verifies AI proof hashes, and triggers vault rebalancing. | Custom / Ownable |
| **`RwaRestakingManager.sol`** | Restaking protocol providing 1.0x – 2.0x boosted multipliers and BOT ecosystem reward points for locked shares. | Custom / SafeERC20 |
| **`RwaAssetToken.sol` (`bUSTB`)** | Tokenized 3-Month US Treasury Bills (5.20% APY, Low Risk, AAA). | ERC-20 + NAV Oracle |
| **`RwaAssetToken.sol` (`bREIT`)** | Tokenized Commercial Real Estate Debt (8.70% APY, Moderate Risk, A+). | ERC-20 + NAV Oracle |
| **`RwaAssetToken.sol` (`bGREEN`)** | Tokenized Green Energy & Infrastructure Bonds (11.40% APY, BBB+). | ERC-20 + NAV Oracle |
| **`MockUSDT.sol`** | Demo stablecoin with built-in public faucet for testing and evaluation. | ERC-20 + Faucet |

---

## 🚀 Quick Deployment Guide

### 1. Prerequisites
Configure your deployer private key in `.env`:
```bash
PRIVATE_KEY="your_private_key_here"
```

### 2. Deploy to BOT Chain Testnet (Chain ID 968)
```bash
npm run deploy:testnet
```

### 3. Deploy to BOT Chain Mainnet (Chain ID 677)
```bash
npm run deploy:mainnet
```

---

## ⛽ Mainnet Gas Support Application Guide (1 BOT per Project)

BOT Chain provides **1 BOT** in gas support for eligible builders deploying to Mainnet.

1. Open the [Gas Support Application Form](https://forms.gle/QGWNnmthCDgL92uR9).
2. **Project Name:** OmniRWA
3. **Track:** RWA Applications / AI Native Applications
4. **Deployer Address:** *(Insert your deployer wallet address)*
5. **Contract Description:** OmniRWA Vault (ERC-4626) and AI Strategy Controller for real-world asset restaking.
6. **Telegram Contact:** *(Insert your Telegram username)*

---

## 📝 Official Google Form Submission Template

Use this ready-to-paste template when submitting your project on the [BOT Chain Challenge Submission Form](https://forms.gle/ZKvnfcGrkZmdgigA8):

### 1. Project Title
`OmniRWA — Autonomous AI-Managed RWA Restaking & Yield Aggregator`

### 2. Track Selection
`🏆 RWA Applications` *(or both RWA and AI Native)*

### 3. Short Description (1-2 Sentences)
`OmniRWA is an institutional-grade ERC-4626 vault protocol on BOT Chain where an autonomous AI Strategy Controller actively optimizes yields and restaking across tokenized US Treasuries, Real Estate Debt, and Green Infrastructure.`

### 4. Detailed Description & Value Proposition
`OmniRWA brings institutional real-world asset (RWA) management to the BOT Chain ecosystem. By deploying tokenized asset wrappers for sovereign debt (bUSTB, 5.2% APY), real estate credit (bREIT, 8.7% APY), and renewable infrastructure (bGREEN, 11.4% APY), OmniRWA aggregates diverse yield sources into a unified omniRWA vault share. 

Unlike traditional static vaults, OmniRWA features an autonomous on-chain AI Agent Controller that evaluates macro credit risk and executes rebalancing on-chain, storing cryptographic decision proofs for transparency. Users can also restake vault shares across 4 lockup tiers to earn boosted yields and native BOT ecosystem reward points.`

### 5. Why BOT Chain?
`BOT Chain's high-throughput, low gas fee EVM architecture makes continuous on-chain AI rebalancing and micro-yield restaking economically viable. BOT Chain's strategic focus on the AI Agent Economy and RWA infrastructure creates the ideal ecosystem for OmniRWA to scale as a core liquidity and asset aggregation layer.`

### 6. Mainnet Contract Addresses
* **OmniRwaVault (ERC-4626):** `0x3DAcbF0F199e804EB6572C62a5fBFCA6C92992A5`
* **AiStrategyController:** `0xcB51723766223872427F49A1ec0aD4d57b667821`
* **RwaRestakingManager:** `0xAD33aA3F0464b647e91bc026e2A4Daa0C40048d1`
* **MockUSDT (Faucet):** `0x9CFbee56C9Ae7DacD1c6ac040eCcE04c803E12D8`
* **Tokenized RWA Assets:**
  * `bUSTB` (US Treasuries 5.2% APY): `0xdc162849bD2c2B0dfF9e47ABf3Cd00734117EFCA`
  * `bREIT` (Commercial Real Estate 8.7% APY): `0xeF919280728e2f78fe04F5813134616Fa276Dd12`
  * `bGREEN` (Green Energy Bonds 11.4% APY): `0x198e48AfAF7b7eb1e6CcFbb14458A83FFc618967`

---

## 🎬 2-Minute Demo Video Script

* **0:00 - 0:25 (The Problem & Solution):**
  > *"Welcome to OmniRWA, the first autonomous AI-managed RWA restaking protocol built natively on BOT Chain. Tokenized real-world assets offer stable yields, but capital is often trapped in static pools. OmniRWA solves this with automated ERC-4626 vaults and on-chain AI agents."*

* **0:25 - 0:50 (Deposit & Faucet Flow):**
  > *"Let's connect our wallet on BOT Chain. With 1-click on our testnet/mainnet faucet, we receive 10,000 USDT. We deposit 5,000 USDT into the OmniVault, instantly minting yield-bearing omniRWA shares backed by our tokenized US Treasury, Real Estate, and Green Energy strategies."*

* **0:50 - 1:20 (Autonomous AI Rebalancing):**
  > *"Now let's look at the AI Strategy Agent tab. Powered by Gemini, the AI controller monitors credit spreads and risk parameters. We can see our live scenario simulator — switching from Balanced to High-Yield or Defensive. When the AI triggers a rebalance, the transaction is executed directly on BOT Chain with an immutable decision proof hash."*

* **1:20 - 1:45 (RWA Restaking & Proof of Reserve):**
  > *"Finally, we restake our omniRWA shares into the 90-day tier for a 1.5x yield boost, accruing BOT reward points in real time. Under Proof of Reserve, all underlying collateral, NAV prices, and IPFS custody attestations are verifiable on BOTScan."*

* **1:45 - 2:00 (Conclusion):**
  > *"OmniRWA brings institutional AI intelligence and deep RWA liquidity to BOT Chain. Thank you!"*
