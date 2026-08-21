# 🌐 OmniRWA Protocol

> **Institutional-grade Real-World Asset (RWA) Yield Aggregator & Restaking Engine powered by Autonomous AI Agents on BOT Chain.**

🔗 **Live Production URL**: [https://omni-rwa.vercel.app/](https://omni-rwa.vercel.app/)

---

## 🛰️ Live Deployments

### BOT Chain Mainnet (Chain ID: 677)

| Contract | Address | Explorer Link |
| --- | --- | --- |
| **Mock USDT** | `0x792CADF05b4A16F35bf24b6170162776A02FBBcF` | [View on BOTScan](https://scan.botchain.ai/address/0x792CADF05b4A16F35bf24b6170162776A02FBBcF) |
| **bUSTB (US Treasury 3M)** | `0x717958e45fe7Fb6cb9c221D1F26F279c63838B62` | [View on BOTScan](https://scan.botchain.ai/address/0x717958e45fe7Fb6cb9c221D1F26F279c63838B62) |
| **bREIT (Commercial Real Estate)** | `0x162BCE9e137Ec5Fafcf57280dC840c61365076ea` | [View on BOTScan](https://scan.botchain.ai/address/0x162BCE9e137Ec5Fafcf57280dC840c61365076ea) |
| **bGREEN (Green Infrastructure)** | `0xEba6106C100b8Ff61e3190EaB4c7fabb71987f91` | [View on BOTScan](https://scan.botchain.ai/address/0xEba6106C100b8Ff61e3190EaB4c7fabb71987f91) |
| **OmniRwaVault (ERC-4626)** | `0x7d21ed4F7767d9e58De29D8d80BD0246e180113a` | [View on BOTScan](https://scan.botchain.ai/address/0x7d21ed4F7767d9e58De29D8d80BD0246e180113a) |
| **AiStrategyController** | `0x846ad8b62b3626966Cd6D7C716e0bBE95C71766d` | [View on BOTScan](https://scan.botchain.ai/address/0x846ad8b62b3626966Cd6D7C716e0bBE95C71766d) |
| **RwaRestakingManager** | `0x88b9e4074186A4849569EfEA805B40Be0fbEe737` | [View on BOTScan](https://scan.botchain.ai/address/0x88b9e4074186A4849569EfEA805B40Be0fbEe737) |

### BOT Chain Testnet (Chain ID: 968)

| Contract | Address | Explorer Link |
| --- | --- | --- |
| **Mock USDT** | `0xd3a39e80a0680A6564619d08eB1b2c45eB684949` | [View on BOTScan](https://scan.bohr.life/address/0xd3a39e80a0680A6564619d08eB1b2c45eB684949) |
| **bUSTB (US Treasury 3M)** | `0xdc162849bD2c2B0dfF9e47ABf3Cd00734117EFCA` | [View on BOTScan](https://scan.bohr.life/address/0xdc162849bD2c2B0dfF9e47ABf3Cd00734117EFCA) |
| **bREIT (Commercial Real Estate)** | `0xeF919280728e2f78fe04F5813134616Fa276Dd12` | [View on BOTScan](https://scan.bohr.life/address/0xeF919280728e2f78fe04F5813134616Fa276Dd12) |
| **bGREEN (Green Infrastructure)** | `0x198e48AfAF7b7eb1e6CcFbb14458A83FFc618967` | [View on BOTScan](https://scan.bohr.life/address/0x198e48AfAF7b7eb1e6CcFbb14458A83FFc618967) |
| **OmniRwaVault (ERC-4626)** | `0x3DAcbF0F199e804EB6572C62a5fBFCA6C92992A5` | [View on BOTScan](https://scan.bohr.life/address/0x3DAcbF0F199e804EB6572C62a5fBFCA6C92992A5) |
| **AiStrategyController** | `0xEF72A1B0ebF181B7Ff0e30325dD713398c8eCE91` | [View on BOTScan](https://scan.bohr.life/address/0xEF72A1B0ebF181B7Ff0e30325dD713398c8eCE91) |
| **RwaRestakingManager** | `0x153c39E6997B2562dC26AeeD2203F8b61c77A04a` | [View on BOTScan](https://scan.bohr.life/address/0x153c39E6997B2562dC26AeeD2203F8b61c77A04a) |

---

## 📐 Architecture & Flow

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

The system uses three main coordination modules:
1.  **ERC-4626 Vault:** Manages user deposits/withdrawals of `MockUSDT` and distributes asset allocations.
2.  **Autonomous AI Strategy Controller:** An agent-compatible module that allows authorized AI models (e.g. Gemini-3.7-Flash) to rebalance vault weights dynamically based on macro yields, inflation levels, and risk calculations.
3.  **RwaRestakingManager:** Allows users to lock their `omniRWA` vault shares in exchange for boosted yields (up to 2.0x) and BOT ecosystem points.

---

## 🛡️ Security Parameters & Onchain Guardrails

To prevent high-risk allocation errors or malicious agent decisions, the smart contracts enforce strict mathematical boundaries on-chain:
1.  **Sovereign Treasury Floor:** The protocol enforces a minimum $\ge 20\%$ allocation to low-risk Sovereign Debt (`bUSTB`) at all times.
2.  **Asset Concentration Cap:** No single RWA category may exceed $60\%$ of the total vault net asset value (NAV).
3.  **Rebalance Cooldown:** Rebalance calls are rate-limited with cryptographic IPFS proofs logged for every allocation update.

---

## 🔧 Dev Setup & Testing

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** or **yarn**

### 2. Installation
```bash
git clone https://github.com/ritesh59697/omni-rwa.git
cd omni-rwa
npm install
```

### 3. Running Hardhat Test Suite
Verify that all 8 core test cases pass locally:
```bash
npx hardhat test
```

### 4. Running the Frontend Locally
```bash
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080 in your browser
```

---

## 🌟 Ecosystem Integration & Growth Roadmap

### 1. Why BOT Chain?
OmniRWA was built natively for BOT Chain to leverage its unique positioning as a high-performance EVM network tailored for the **AI Agent Economy**. The low gas overhead and rapid transaction finality allow our automated AI agents to execute rebalancing transactions frequently without eroding user yields.

### 2. New AI & RWA Capabilities
OmniRWA unites the two primary tracks of the challenge into a single composable product:
*   **Onchain AI Autonomy**: Authorized AI models execute rebalances directly via cryptographically signed proofs submitted to the `AiStrategyController`.
*   **Boosted Restaking Yields**: Users can restake their vault shares (`omniRWA`) in `RwaRestakingManager` to lock liquidity and earn amplified yield boosts and BOT ecosystem points.

### 3. User Growth & Sustained Activity
We plan to drive long-term user acquisition and sustained on-chain volume through:
*   **Ecosystem Partnerships**: Integrating with BOT DEXs to set up high-yield liquidity pools for restaked vault shares.
*   **Dynamic AI Rebalancing Events**: AI-driven rebalancing events occur periodically on-chain based on macro yield indicators, generating continuous transaction volume on BOT Chain.
*   **Ecosystem Point Incentives**: Encouraging long-term staking by distributing point rewards that map to BOT Chain network milestones.

---

## 📄 License
MIT License. Built for the BOT Chain Builder Challenge #2.

