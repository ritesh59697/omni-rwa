# 🌐 OmniRWA Protocol

> **Institutional-grade Real-World Asset (RWA) Yield Aggregator & Restaking Engine powered by Autonomous AI Agents on BOT Chain.**

[![Live Demo](https://img.shields.io/badge/Live_dApp-omni--rwa.vercel.app-00D492?style=for-the-badge&logo=vercel)](https://omni-rwa.vercel.app/)
[![Network: BOT Chain Testnet 968](https://img.shields.io/badge/Network-BOT_Chain_Testnet_968-3B82F6?style=for-the-badge)](https://scan.bohr.life)
[![Contracts](https://img.shields.io/badge/Solidity-0.8.24-orange?style=for-the-badge&logo=solidity)](contracts/)

🔗 **Live Production URL**: [https://omni-rwa.vercel.app/](https://omni-rwa.vercel.app/)

---

## 📌 Overview

**OmniRWA** is a decentralized liquidity and yield aggregation protocol designed for tokenized Real-World Assets. Built as an **ERC-4626 Vault**, OmniRWA dynamically allocates capital across verified, yield-generating tokenized asset baskets (US Treasuries, Commercial Real Estate Debt, and Clean Energy Infrastructure) using autonomous AI decision models.

### 🌟 Key Highlights
- **ERC-4626 Tokenized Vault**: Single-asset deposit (`USDT`) returning yield-bearing `omniRWA` share tokens.
- **Autonomous AI Portfolio Balancing**: Gemini 3.7 Flash risk models analyze macro interest rates, inflation telemetry, and credit risk to execute onchain rebalancing.
- **RWA Restaking Multipliers**: Lock `omniRWA` shares to provide shared security and unlock up to 2.0x reward multipliers + native BOT ecosystem points.
- **100% On-Chain Attestation**: Cryptographic Proof of Reserve and custody documentation referenced via IPFS.

---

## 🏛️ Architecture & Collateral Assets

```
                    ┌─────────────────────────┐
                    │    User / Institutional │
                    │     USDT Liquidity      │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │  OmniRwaVault (ERC-4626)│
                    │   Shares: omniRWA       │
                    └────────────┬────────────┘
                                 │
                 ┌───────────────┼───────────────┐
                 ▼               ▼               ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │    bUSTB    │ │    bREIT    │ │   bGREEN    │
          │ US Treasury │ │ Real Estate │ │ Solar/Wind  │
          │ 5.20% APY   │ │ 8.70% APY   │ │ 11.40% APY  │
          └─────────────┘ └─────────────┘ └─────────────┘
                 ▲               ▲               ▲
                 └───────────────┼───────────────┘
                                 │
                    ┌─────────────────────────┐
                    │  AiStrategyController   │
                    │  Autonomous Rebalancing │
                    └─────────────────────────┘
```

---

## 📜 Verified Smart Contracts (BOT Chain)

| Contract | Address | Network | Explorer Link |
|---|---|---|---|
| **Mock USDT** | `0xd3a39e80a0680A6564619d08eB1b2c45eB684949` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0xd3a39e80a0680A6564619d08eB1b2c45eB684949) |
| **bUSTB (Treasuries)** | `0xdc162849bD2c2B0dfF9e47ABf3Cd00734117EFCA` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0xdc162849bD2c2B0dfF9e47ABf3Cd00734117EFCA) |
| **bREIT (Real Estate)** | `0xeF919280728e2f78fe04F5813134616Fa276Dd12` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0xeF919280728e2f78fe04F5813134616Fa276Dd12) |
| **bGREEN (Clean Energy)** | `0x198e48AfAF7b7eb1e6CcFbb14458A83FFc618967` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0x198e48AfAF7b7eb1e6CcFbb14458A83FFc618967) |
| **OmniRwaVault (ERC-4626)** | `0x3DAcbF0F199e804EB6572C62a5fBFCA6C92992A5` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0x3DAcbF0F199e804EB6572C62a5fBFCA6C92992A5) |
| **AiStrategyController** | `0xEF72A1B0ebF181B7Ff0e30325dD713398c8eCE91` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0xEF72A1B0ebF181B7Ff0e30325dD713398c8eCE91) |
| **RwaRestakingManager** | `0x153c39E6997B2562dC26AeeD2203F8b61c77A04a` | BOT Chain (968) | [View on BOTScan](https://scan.bohr.life/address/0x153c39E6997B2562dC26AeeD2203F8b61c77A04a) |

---

## 🛠️ Quickstart & Local Setup

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**

### 2. Installation
```bash
git clone https://github.com/ritesh59697/omni-rwa.git
cd omni-rwa
npm install
```

### 3. Running Automated Tests
```bash
npx hardhat test
```

### 4. Deploying to BOT Chain
```bash
# Set your private key in .env or hardhat.config.js
npx hardhat run scripts/deploy.js --network botTestnet
```

### 5. Running the Frontend Locally
```bash
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

---

## 🛡️ Security Parameters & Onchain Guardrails
1. **Sovereign Treasury Floor**: The protocol enforces a minimum $\ge 20\%$ allocation to low-risk Sovereign Debt (`bUSTB`) at all times.
2. **Asset Concentration Cap**: No single RWA category may exceed $60\%$ of the total vault NAV.
3. **Rebalance Cooldown**: AI rebalances are rate-limited with cryptographic IPFS proofs logged for every allocation update.

---

## 📄 License
MIT License. Built for the BOT Chain Hackathon 2026.
