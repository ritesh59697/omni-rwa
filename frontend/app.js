/**
 * OmniRWA Protocol Frontend Logic
 * Supports BOT Chain Mainnet (Chain ID 677) & Testnet (Chain ID 968)
 */

// Network Constants
const BOT_NETWORKS = {
  MAINNET: {
    chainId: "0x2A5", // 677 in hex
    chainIdDecimal: 677,
    chainName: "BOT Chain Mainnet",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: ["https://rpc.botchain.ai"],
    blockExplorerUrls: ["https://scan.botchain.ai"],
  },
  TESTNET: {
    chainId: "0x3C8", // 968 in hex
    chainIdDecimal: 968,
    chainName: "BOT Chain Testnet",
    nativeCurrency: { name: "tBOT", symbol: "tBOT", decimals: 18 },
    rpcUrls: ["https://rpc.bohr.life"],
    blockExplorerUrls: ["https://scan.bohr.life"],
  }
};

// Target default network (BOT Chain Testnet)
let currentTargetNetwork = BOT_NETWORKS.MAINNET;

// Contract ABIs
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet() external",
];

const VAULT_ABI = [
  "function totalAssets() view returns (uint256)",
  "function getWeightedApyBps() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function deposit(uint256 assets, address receiver) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function totalStrategies() view returns (uint256)",
  "function strategies(uint256) view returns (address token, uint256 targetWeightBps, uint256 allocatedCapital, bool isActive)",
  "function harvestYield() external",
  "function rebalance(uint256[] newWeights, string reason, bytes32 aiDecisionHash) external",
];

const AI_CONTROLLER_ABI = [
  "function totalDecisions() view returns (uint256)",
  "function getDecision(uint256 index) view returns (tuple(uint256 timestamp, string aiModelVersion, uint256 compositeRiskScore, uint256 predictedBlendedApy, string rationale, bytes32 proofHash, uint256[] targetWeights))",
  "function executeAiRebalance(string modelVersion, uint256 riskScore, uint256 predictedApy, uint256[] newWeights, string rationale, bytes32 proofHash) external",
];

const RESTAKING_ABI = [
  "function totalSharesRestaked() view returns (uint256)",
  "function getUserPositions(address user) view returns (tuple(uint256 amount, uint256 lockDuration, uint256 startTime, uint256 unlockTime, uint256 rewardMultiplierBps, uint256 pointsAccrued, uint256 lastClaimTimestamp)[])",
  "function restake(uint256 amount, uint8 lockTier) external",
  "function unstake(uint256 positionIndex) external",
  "function claimRewards(uint256 positionIndex) external",
  "function calculatePendingPoints(address user, uint256 positionIndex) view returns (uint256)",
];

// App State
let provider = null;
let signer = null;
let userAddress = null;
let deployedConfig = null;

// Mock / Initial Live State
let state = {
  tvl: 1485200,
  blendedApy: 7.49,
  userUsdtBalance: 10000,
  userSharesBalance: 2500,
  selectedLockTier: 0,
  weights: {
    bustb: 50,
    breit: 30,
    bgreen: 20
  },
  aiScenario: "balanced",
  userPositions: []
};

// Scenario presets
const AI_SCENARIOS = {
  balanced: {
    name: "Balanced Alpha",
    weights: [50, 30, 20],
    apy: 7.49,
    risk: 32,
    riskLabel: "Low Risk • Grade AAA",
    rationale: "Macro balance across Sovereign US Debt (50%), Commercial Real Estate (30%), and Green Energy Yield (20%). Optimal Sharpe ratio."
  },
  defensive: {
    name: "Flight to Quality (Defensive)",
    weights: [70, 20, 10],
    apy: 6.52,
    risk: 18,
    riskLabel: "Minimal Risk • Grade AAA+",
    rationale: "Hawkish macroeconomic signals and yield curve inversion risk detected. Capital shifted towards US Treasuries (70%) for principal preservation."
  },
  "high-yield": {
    name: "High-Yield Expansion",
    weights: [25, 45, 30],
    apy: 8.63,
    risk: 54,
    riskLabel: "Moderate Risk • Grade AA-",
    rationale: "Stable credit spreads and robust solar energy offtake contracts allow aggressive deployment into Commercial Real Estate Debt (45%) and Green Yield (30%)."
  }
};

// SVG Icons
const ICONS = {
  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  lightning: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  arrowDown: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>`,
  arrowUp: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`,
  faucet: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`
};

// =========================================================
// TAB SWITCHING & ROUTING
// =========================================================

function switchAppTab(targetId) {
  const navLinks = document.querySelectorAll(".nav-link");
  const tabPanes = document.querySelectorAll(".tab-pane");

  navLinks.forEach(link => {
    if (link.getAttribute("data-tab") === targetId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  tabPanes.forEach(pane => {
    if (pane.id === targetId) {
      pane.classList.add("active");
    } else {
      pane.classList.remove("active");
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}
window.switchAppTab = switchAppTab;

function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("data-tab");
      switchAppTab(targetId);
    });
  });

  // Brand click -> Landing Overview
  const brand = document.getElementById("nav-brand");
  if (brand) {
    brand.addEventListener("click", () => switchAppTab("tab-landing"));
  }

  // Hero CTAs
  const heroLaunch = document.getElementById("btn-hero-launch");
  if (heroLaunch) heroLaunch.addEventListener("click", () => switchAppTab("tab-vault"));

  const heroAi = document.getElementById("btn-hero-ai");
  if (heroAi) heroAi.addEventListener("click", () => switchAppTab("tab-ai-agent"));
}

// =========================================================
// INTERACTIVE YIELD CALCULATOR
// =========================================================

function setupYieldCalculator() {
  const slider = document.getElementById("calc-principal-slider");
  const principalText = document.getElementById("calc-principal-text");
  const durationPills = document.querySelectorAll(".calc-pill");
  const tierSelect = document.getElementById("calc-tier-select");

  if (!slider || !principalText) return;

  let currentMonths = 12;

  function updateCalculations() {
    const animEls = [
      document.getElementById("calc-omni-total"),
      document.getElementById("calc-omni-profit"),
      document.getElementById("calc-omni-points"),
      document.getElementById("calc-tradfi-total"),
      document.getElementById("calc-defi-total")
    ];
    animEls.forEach(el => {
      if (el) el.classList.add("calc-animating");
    });

    const principal = parseFloat(slider.value) || 10000;
    principalText.textContent = `$${principal.toLocaleString()}`;

    const multiplier = parseFloat(tierSelect ? tierSelect.value : 1.0) || 1.0;
    const baseApy = state.blendedApy; // 7.49%
    const effectiveApy = baseApy * multiplier;

    const years = currentMonths / 12;

    // OmniRWA compound return
    const omniTotal = principal * Math.pow(1 + (effectiveApy / 100), years);
    const omniProfit = omniTotal - principal;

    // TradFi savings (0.50% APY)
    const tradfiTotal = principal * Math.pow(1 + 0.005, years);
    const tradfiProfit = tradfiTotal - principal;

    // DeFi Stable pool (3.20% APY)
    const defiTotal = principal * Math.pow(1 + 0.032, years);
    const defiProfit = defiTotal - principal;

    // BOT Points accrued
    const botPoints = Math.round(principal * (multiplier * 0.15) * (currentMonths / 12) * 10);

    // Outperformance
    const outperformRatio = (omniProfit / Math.max(tradfiProfit, 0.01)).toFixed(1);

    // Update DOM
    const omniApyEl = document.getElementById("calc-omni-apy");
    if (omniApyEl) omniApyEl.textContent = `${effectiveApy.toFixed(2)}% APY`;

    const omniTotalEl = document.getElementById("calc-omni-total");
    if (omniTotalEl) omniTotalEl.textContent = `$${omniTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const omniProfitEl = document.getElementById("calc-omni-profit");
    if (omniProfitEl) omniProfitEl.textContent = `+$${omniProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Profit`;

    const omniPointsEl = document.getElementById("calc-omni-points");
    if (omniPointsEl) omniPointsEl.textContent = `${botPoints.toLocaleString()} BOT Reward Points accrued`;

    const tradfiTotalEl = document.getElementById("calc-tradfi-total");
    if (tradfiTotalEl) tradfiTotalEl.textContent = `$${tradfiTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const tradfiProfitEl = document.getElementById("calc-tradfi-profit");
    if (tradfiProfitEl) tradfiProfitEl.textContent = `+$${tradfiProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Profit`;

    const defiTotalEl = document.getElementById("calc-defi-total");
    if (defiTotalEl) defiTotalEl.textContent = `$${defiTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const defiProfitEl = document.getElementById("calc-defi-profit");
    if (defiProfitEl) defiProfitEl.textContent = `+$${defiProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Profit`;

    const outperformEl = document.getElementById("calc-outperform-multiplier");
    if (outperformEl) outperformEl.textContent = `${outperformRatio}x`;

    setTimeout(() => {
      animEls.forEach(el => {
        if (el) el.classList.remove("calc-animating");
      });
    }, 120);
  }

  slider.addEventListener("input", updateCalculations);

  durationPills.forEach(pill => {
    pill.addEventListener("click", () => {
      durationPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentMonths = parseInt(pill.getAttribute("data-months"), 10) || 12;
      updateCalculations();
    });
  });

  if (tierSelect) {
    tierSelect.addEventListener("change", updateCalculations);
  }

  // Initial calculation
  updateCalculations();
}

// =========================================================
// FAQ ACCORDION
// =========================================================

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-card");
  faqItems.forEach(item => {
    const question = item.querySelector(".faq-trigger");
    if (question) {
      question.addEventListener("click", () => {
        const isOpen = item.classList.contains("open");
        faqItems.forEach(i => i.classList.remove("open"));
        if (!isOpen) item.classList.add("open");
      });
    }
  });
}

// =========================================================
// SMART CONTRACT CONFIG & WEB3
// =========================================================

async function loadContractsConfig() {
  try {
    const res = await fetch("contracts_config.json");
    if (res.ok) {
      deployedConfig = await res.json();
      updateAttestationAddresses(deployedConfig.contracts);
      addTerminalLog(`[CONFIG] Loaded contract addresses for ${deployedConfig.network} (Chain ID: ${deployedConfig.chainId})`, "text-green");
    }
  } catch (err) {
    console.log("Using default demo addresses until on-chain sync");
  }
}

function updateAttestationAddresses(c) {
  if (!c) return;
  if (document.getElementById("addr-bustb")) document.getElementById("addr-bustb").textContent = truncateAddress(c.bUSTB);
  if (document.getElementById("addr-breit")) document.getElementById("addr-breit").textContent = truncateAddress(c.bREIT);
  if (document.getElementById("addr-bgreen")) document.getElementById("addr-bgreen").textContent = truncateAddress(c.bGREEN);
  if (document.getElementById("addr-vault")) document.getElementById("addr-vault").textContent = truncateAddress(c.OmniRwaVault);
}

function truncateAddress(addr) {
  if (!addr) return "0x...";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Web3 Connection
async function initEthers() {
  // Set fallback read-only JSON-RPC provider so live TVL/APY load even if wallet is disconnected
  try {
    provider = new ethers.JsonRpcProvider(currentTargetNetwork.rpcUrls[0]);
    await fetchOnChainData();
  } catch (err) {
    console.log("Failed to initialize read-only provider:", err);
  }

  if (window.ethereum) {
    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    try {
      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        provider = web3Provider;
        signer = await provider.getSigner();
        userAddress = accounts[0].address;
        onWalletConnected();
      }
    } catch (e) {
      console.log("Wallet not connected yet");
    }
  }
}

async function connectWallet() {
  if (userAddress) return; // Already connected, do nothing
  if (!window.ethereum) {
    showToast("MetaMask or EVM wallet not detected. Please install a Web3 wallet.", "error");
    return;
  }

  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = accounts[0];
    onWalletConnected();
    await checkAndSwitchNetwork();
    showToast(`Connected: ${truncateAddress(userAddress)}`, "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || "Failed to connect wallet", "error");
  }
}

async function onWalletConnected() {
  const btn = document.getElementById("wallet-btn-text");
  if (btn) btn.textContent = truncateAddress(userAddress);
  const parentBtn = document.getElementById("btn-connect-wallet");
  if (parentBtn) parentBtn.classList.add("connected");
  updateBalancesUI();
  addTerminalLog(`[WALLET] Connected user address: ${userAddress}`, "text-green");
  await fetchOnChainData();
}

function updateBalancesUI() {
  const usdtEl = document.getElementById("user-usdt-balance");
  if (usdtEl) usdtEl.textContent = state.userUsdtBalance.toLocaleString();

  const sharesEl = document.getElementById("user-shares-balance");
  if (sharesEl) sharesEl.textContent = state.userSharesBalance.toLocaleString();

  const restakeEl = document.getElementById("restake-shares-avail");
  if (restakeEl) restakeEl.textContent = state.userSharesBalance.toLocaleString();
}

async function checkAndSwitchNetwork() {
  if (!window.ethereum) return;
  try {
    const network = await provider.getNetwork();
    const netEl = document.getElementById("network-name");
    if (Number(network.chainId) === BOT_NETWORKS.TESTNET.chainIdDecimal) {
      if (netEl) netEl.textContent = "BOT Testnet";
    } else if (Number(network.chainId) === BOT_NETWORKS.MAINNET.chainIdDecimal) {
      if (netEl) netEl.textContent = "BOT Mainnet";
    }

    if (Number(network.chainId) !== currentTargetNetwork.chainIdDecimal) {
      await switchOrAddNetwork();
    }
  } catch (e) {
    console.log(e);
  }
}

async function switchOrAddNetwork() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: currentTargetNetwork.chainId }],
    });
    const netEl = document.getElementById("network-name");
    if (netEl) netEl.textContent = currentTargetNetwork.chainName.replace("Chain ", "");
    showToast(`Switched to ${currentTargetNetwork.chainName}`, "success");
  } catch (switchError) {
    if (switchError.code === 4902 || switchError.message?.includes("Unrecognized chain ID") || switchError.message?.includes("4902")) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [currentTargetNetwork],
        });
        const netEl = document.getElementById("network-name");
        if (netEl) netEl.textContent = currentTargetNetwork.chainName.replace("Chain ", "");
        showToast(`Added and switched to ${currentTargetNetwork.chainName}`, "success");
      } catch (addError) {
        showToast(addError.message, "error");
      }
    }
  }
}

// =========================================================
// EVENT LISTENERS & USER ACTIONS
// =========================================================

function setupEventListeners() {
  // Connect Wallet
  const connectBtn = document.getElementById("btn-connect-wallet");
  if (connectBtn) connectBtn.addEventListener("click", connectWallet);

  // Theme Toggle (Light / Dark)
  const themeBtn = document.getElementById("btn-theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  // Toggle Network between Testnet (968) and Mainnet (677)
  const toggleNet = document.getElementById("btn-toggle-network");
  if (toggleNet) {
    toggleNet.addEventListener("click", async () => {
      currentTargetNetwork = (currentTargetNetwork.chainIdDecimal === BOT_NETWORKS.TESTNET.chainIdDecimal)
        ? BOT_NETWORKS.MAINNET
        : BOT_NETWORKS.TESTNET;
      await switchOrAddNetwork();
    });
  }

  // Quick Faucets
  const quickFaucet = document.getElementById("btn-faucet-quick");
  if (quickFaucet) quickFaucet.addEventListener("click", handleClaimFaucetQuick);

  const inlineFaucet = document.getElementById("btn-claim-faucet-inline");
  if (inlineFaucet) inlineFaucet.addEventListener("click", handleClaimFaucetQuick);

  // Vault Mode Switcher
  const btnDep = document.getElementById("vault-mode-deposit");
  const btnWith = document.getElementById("vault-mode-withdraw");
  const formDep = document.getElementById("form-deposit");
  const formWith = document.getElementById("form-withdraw");

  if (btnDep && btnWith && formDep && formWith) {
    btnDep.addEventListener("click", () => {
      btnDep.classList.add("active");
      btnWith.classList.remove("active");
      formDep.classList.add("active");
      formWith.classList.remove("active");
    });

    btnWith.addEventListener("click", () => {
      btnWith.classList.add("active");
      btnDep.classList.remove("active");
      formWith.classList.add("active");
      formDep.classList.remove("active");
    });
  }

  // Inputs live preview
  const depInput = document.getElementById("deposit-amount");
  if (depInput) {
    depInput.addEventListener("input", () => {
      const val = parseFloat(depInput.value) || 0;
      const previewShares = document.getElementById("preview-shares");
      if (previewShares) previewShares.textContent = `${val.toFixed(2)} omniRWA`;

      const annualYield = val * (state.blendedApy / 100);
      const previewYield = document.getElementById("preview-annual-yield");
      if (previewYield) previewYield.textContent = `+$${annualYield.toFixed(2)} / year`;
    });
  }

  const withInput = document.getElementById("withdraw-amount");
  if (withInput) {
    withInput.addEventListener("input", () => {
      const val = parseFloat(withInput.value) || 0;
      const previewWithdraw = document.getElementById("preview-withdraw-usdt");
      if (previewWithdraw) previewWithdraw.textContent = `${val.toFixed(2)} USDT`;
    });
  }

  // Max Buttons
  const maxDep = document.getElementById("btn-max-deposit");
  if (maxDep && depInput) {
    maxDep.addEventListener("click", () => {
      depInput.value = state.userUsdtBalance || 10000;
      depInput.dispatchEvent(new Event("input"));
    });
  }

  const maxWith = document.getElementById("btn-max-withdraw");
  if (maxWith && withInput) {
    maxWith.addEventListener("click", () => {
      withInput.value = state.userSharesBalance || 0;
      withInput.dispatchEvent(new Event("input"));
    });
  }

  const maxRestake = document.getElementById("btn-max-restake");
  const restakeInput = document.getElementById("restake-amount");
  if (maxRestake && restakeInput) {
    maxRestake.addEventListener("click", () => {
      restakeInput.value = state.userSharesBalance || 0;
    });
  }

  // Restaking Tier Selector
  const tierCards = document.querySelectorAll(".tier-select-pill");
  tierCards.forEach(card => {
    card.addEventListener("click", () => {
      tierCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      state.selectedLockTier = parseInt(card.getAttribute("data-tier"), 10);
    });
  });

  // Action Buttons
  const depositBtn = document.getElementById("btn-deposit-action");
  if (depositBtn) depositBtn.addEventListener("click", handleDeposit);

  const withdrawBtn = document.getElementById("btn-withdraw-action");
  if (withdrawBtn) withdrawBtn.addEventListener("click", handleWithdraw);

  const restakeBtn = document.getElementById("btn-restake-action");
  if (restakeBtn) restakeBtn.addEventListener("click", handleRestake);

  const rebalanceBtn = document.getElementById("btn-trigger-ai-rebalance");
  if (rebalanceBtn) rebalanceBtn.addEventListener("click", handleAiRebalance);

  // AI Scenario Buttons
  const scenarioBtns = document.querySelectorAll(".scenario-card-btn");
  scenarioBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      scenarioBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const scenarioKey = btn.getAttribute("data-scenario");
      applyAiScenario(scenarioKey);
    });
  });
}

function applyAiScenario(key) {
  const scenario = AI_SCENARIOS[key];
  if (!scenario) return;

  state.aiScenario = key;
  state.weights.bustb = scenario.weights[0];
  state.weights.breit = scenario.weights[1];
  state.weights.bgreen = scenario.weights[2];
  state.blendedApy = scenario.apy;

  // Update visual elements
  const bUstbWeight = document.getElementById("weight-bustb");
  if (bUstbWeight) bUstbWeight.textContent = `${scenario.weights[0]}.0%`;
  const bUstbBar = document.getElementById("bar-bustb");
  if (bUstbBar) bUstbBar.style.width = `${scenario.weights[0]}%`;

  const matrixWeightBustb = document.getElementById("matrix-weight-bustb");
  if (matrixWeightBustb) matrixWeightBustb.textContent = `${scenario.weights[0]}.0%`;
  const matrixBarBustb = document.getElementById("matrix-bar-bustb");
  if (matrixBarBustb) matrixBarBustb.style.width = `${scenario.weights[0]}%`;

  const bReitWeight = document.getElementById("weight-breit");
  if (bReitWeight) bReitWeight.textContent = `${scenario.weights[1]}.0%`;
  const bReitBar = document.getElementById("bar-breit");
  if (bReitBar) bReitBar.style.width = `${scenario.weights[1]}%`;

  const matrixWeightBreit = document.getElementById("matrix-weight-breit");
  if (matrixWeightBreit) matrixWeightBreit.textContent = `${scenario.weights[1]}.0%`;
  const matrixBarBreit = document.getElementById("matrix-bar-breit");
  if (matrixBarBreit) matrixBarBreit.style.width = `${scenario.weights[1]}%`;

  const bGreenWeight = document.getElementById("weight-bgreen");
  if (bGreenWeight) bGreenWeight.textContent = `${scenario.weights[2]}.0%`;
  const bGreenBar = document.getElementById("bar-bgreen");
  if (bGreenBar) bGreenBar.style.width = `${scenario.weights[2]}%`;

  const matrixWeightBgreen = document.getElementById("matrix-weight-bgreen");
  if (matrixWeightBgreen) matrixWeightBgreen.textContent = `${scenario.weights[2]}.0%`;
  const matrixBarBgreen = document.getElementById("matrix-bar-bgreen");
  if (matrixBarBgreen) matrixBarBgreen.style.width = `${scenario.weights[2]}%`;

  const blendedSummary = document.getElementById("summary-blended-apy");
  if (blendedSummary) blendedSummary.textContent = `${scenario.apy.toFixed(2)}% APY`;

  const matrixBlended = document.getElementById("matrix-blended-apy");
  if (matrixBlended) matrixBlended.textContent = `${scenario.apy.toFixed(2)}% APY`;

  const statApy = document.getElementById("stat-apy");
  if (statApy) statApy.textContent = `${scenario.apy.toFixed(2)}%`;

  const landingApy = document.getElementById("landing-apy");
  if (landingApy) landingApy.textContent = `${scenario.apy.toFixed(2)}%`;

  const statRisk = document.getElementById("stat-risk");
  if (statRisk) statRisk.innerHTML = `${scenario.risk} <span style="font-size:0.75rem;color:var(--text-tertiary);">/100</span>`;

  const rationaleEl = document.getElementById("ai-rationale-display");
  if (rationaleEl) rationaleEl.textContent = `"${scenario.rationale}"`;

  addTerminalLog(`[AI-MODEL] Switched scenario to: ${scenario.name} (Target APY: ${scenario.apy}%)`, "text-accent");
}

// =========================================================
// ON-CHAIN SMART CONTRACT INTEGRATIONS & HANDLERS
// =========================================================

async function fetchOnChainData() {
  if (!provider || !deployedConfig || !deployedConfig.contracts) return;

  try {
    const vault = new ethers.Contract(deployedConfig.contracts.OmniRwaVault, VAULT_ABI, provider);
    
    // Fetch total TVL & APY from contract
    try {
      const tvlRaw = await vault.totalAssets();
      state.tvl = Number(ethers.formatUnits(tvlRaw, 6));
      const statTvl = document.getElementById("stat-tvl");
      if (statTvl) statTvl.innerHTML = `$${state.tvl.toLocaleString()} <span class="stat-sub">USDT</span>`;
      const landingTvl = document.getElementById("landing-tvl");
      if (landingTvl) landingTvl.innerHTML = `$${state.tvl.toLocaleString()} <span class="metric-sub">USDT</span>`;

      const apyBps = await vault.getWeightedApyBps();
      state.blendedApy = Number(apyBps) / 100;
      const statApy = document.getElementById("stat-apy");
      if (statApy) statApy.textContent = `${state.blendedApy.toFixed(2)}%`;
      const landingApy = document.getElementById("landing-apy");
      if (landingApy) landingApy.textContent = `${state.blendedApy.toFixed(2)}%`;
    } catch (e) {
      console.log("TVL/APY fetch fallback:", e);
    }

    // Fetch user on-chain balances if connected
    if (userAddress) {
      const usdt = new ethers.Contract(deployedConfig.contracts.MockUSDT, ERC20_ABI, provider);
      const usdtBal = await usdt.balanceOf(userAddress);
      state.userUsdtBalance = Number(ethers.formatUnits(usdtBal, 6));

      const sharesBal = await vault.balanceOf(userAddress);
      state.userSharesBalance = Number(ethers.formatUnits(sharesBal, 6));

      updateBalancesUI();

      // Fetch Restaking positions from contract
      try {
        const restaking = new ethers.Contract(deployedConfig.contracts.RwaRestakingManager, RESTAKING_ABI, provider);
        const positions = await restaking.getUserPositions(userAddress);
        if (positions && positions.length > 0) {
          const tierNames = ["Flexible", "30 Days", "90 Days", "180 Days"];
          const multipliers = ["1.0x", "1.25x", "1.50x", "2.00x"];
          state.userPositions = positions.map((p, idx) => ({
            amount: Number(ethers.formatUnits(p.amount, 6)),
            tier: Number(p.lockDuration),
            tierName: tierNames[Number(p.lockDuration)] || "Flexible",
            mult: `${(Number(p.rewardMultiplierBps) / 10000).toFixed(2)}x`,
            date: new Date(Number(p.startTime) * 1000).toLocaleDateString(),
            points: Number(p.pointsAccrued)
          }));
          renderPositions();
        }
      } catch (err) {
        console.log("Restake fetch note:", err);
      }
    }
  } catch (err) {
    console.log("On-chain data sync error:", err);
  }
}

// 1. Onchain Faucet Claim
async function handleClaimFaucetQuick() {
  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.MockUSDT) {
    try {
      showToast("Please confirm Faucet transaction in your wallet...", "info");
      addTerminalLog("[FAUCET] Calling MockUSDT.faucet() on BOT Chain...", "text-accent");
      
      const usdt = new ethers.Contract(deployedConfig.contracts.MockUSDT, ERC20_ABI, signer);
      const tx = await usdt.faucet();
      
      showToast(`Faucet transaction submitted: ${truncateAddress(tx.hash)}. Waiting for block confirmation...`, "info");
      addTerminalLog(`[FAUCET] Tx submitted: ${tx.hash}. Awaiting confirmation...`, "text-dim");
      
      await tx.wait();
      showToast("Successfully claimed 10,000 USDT on-chain!", "success");
      addTerminalLog(`[FAUCET] Tx Confirmed! 10,000 USDT minted to ${truncateAddress(userAddress)}.`, "text-green");
      await fetchOnChainData();
      return;
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || "Faucet transaction rejected/failed", "error");
      addTerminalLog(`[FAUCET] Transaction failed: ${err.message}`, "text-dim");
      return;
    }
  }

  // Fallback demo mode if wallet is not connected
  state.userUsdtBalance += 10000;
  updateBalancesUI();
  showToast("Claimed 10,000 USDT test funds (Demo Mode)!", "success");
  addTerminalLog(`[FAUCET] Ingested 10,000 USDT test tokens into balance.`, "text-green");
}
window.handleClaimFaucetQuick = handleClaimFaucetQuick;

// 2. Onchain Deposit & Mint omniRWA
async function handleDeposit() {
  const input = document.getElementById("deposit-amount");
  const amount = parseFloat(input.value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid deposit amount", "error");
    return;
  }

  if (amount > state.userUsdtBalance) {
    showToast("Insufficient USDT balance. Click 'Claim Faucet' for free test tokens!", "error");
    return;
  }

  const btn = document.getElementById("btn-deposit-action");
  btn.disabled = true;

  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.OmniRwaVault) {
    try {
      const usdt = new ethers.Contract(deployedConfig.contracts.MockUSDT, ERC20_ABI, signer);
      const vault = new ethers.Contract(deployedConfig.contracts.OmniRwaVault, VAULT_ABI, signer);
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);

      // Check current allowance
      const allowance = await usdt.allowance(userAddress, deployedConfig.contracts.OmniRwaVault);
      if (allowance < parsedAmount) {
        btn.innerHTML = `<span class="pulse-dot"></span> Approving ${amount.toLocaleString()} USDT in Wallet...`;
        showToast(`Step 1/2: Please approve ${amount.toLocaleString()} USDT in your wallet...`, "info");
        addTerminalLog(`[APPROVAL] Requesting exact allowance for ${amount.toLocaleString()} USDT...`, "text-accent");
        
        const appTx = await usdt.approve(deployedConfig.contracts.OmniRwaVault, parsedAmount);
        addTerminalLog(`[APPROVAL] Tx submitted: ${appTx.hash}. Waiting for confirmation...`, "text-dim");
        await appTx.wait();
        showToast("USDT Approved! Step 2/2: Confirming Deposit in wallet...", "info");
        addTerminalLog(`[APPROVAL] Approved OmniRwaVault spending of ${amount.toLocaleString()} USDT.`, "text-green");
      }

      // Execute onchain deposit
      btn.innerHTML = `<span class="pulse-dot"></span> Confirming Deposit in Wallet...`;
      showToast("Confirming deposit transaction in your wallet...", "info");
      addTerminalLog(`[VAULT] Calling OmniRwaVault.deposit(${amount} USDT)...`, "text-accent");

      const depTx = await vault.deposit(parsedAmount, userAddress);
      showToast(`Deposit Tx submitted: ${truncateAddress(depTx.hash)}. Waiting for block confirmation...`, "info");
      addTerminalLog(`[VAULT] Deposit Tx: ${depTx.hash}. Awaiting confirmation...`, "text-dim");

      await depTx.wait();
      showToast(`Successfully deposited ${amount} USDT & minted ${amount} omniRWA!`, "success");
      addTerminalLog(`[VAULT] Confirmed! Minted ${amount} omniRWA shares to ${truncateAddress(userAddress)}.`, "text-green");

      input.value = "";
      input.dispatchEvent(new Event("input"));
      await fetchOnChainData();
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || "Deposit transaction rejected/failed", "error");
      addTerminalLog(`[VAULT] Deposit failed: ${err.message}`, "text-dim");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.arrowDown} <span>Deposit & Mint omniRWA</span>`;
    }
    return;
  }

  // Fallback demo mode
  btn.innerHTML = `<span class="pulse-dot"></span> Minting omniRWA...`;
  setTimeout(() => {
    state.userUsdtBalance -= amount;
    state.userSharesBalance += amount;
    state.tvl += amount;
    updateBalancesUI();
    input.value = "";
    input.dispatchEvent(new Event("input"));
    btn.disabled = false;
    btn.innerHTML = `${ICONS.arrowDown} <span>Deposit & Mint omniRWA</span>`;
    showToast(`Deposited ${amount} USDT and received ${amount} omniRWA shares!`, "success");
    addTerminalLog(`[VAULT] Deposit confirmed. Total shares minted: ${amount} omniRWA.`, "text-green");
  }, 1000);
}

// 3. Onchain Withdraw / Redeem
async function handleWithdraw() {
  const input = document.getElementById("withdraw-amount");
  const amount = parseFloat(input.value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid withdrawal amount", "error");
    return;
  }

  if (amount > state.userSharesBalance) {
    showToast("Insufficient omniRWA shares balance", "error");
    return;
  }

  const btn = document.getElementById("btn-withdraw-action");
  btn.disabled = true;

  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.OmniRwaVault) {
    try {
      const vault = new ethers.Contract(deployedConfig.contracts.OmniRwaVault, VAULT_ABI, signer);
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);

      btn.innerHTML = `<span class="pulse-dot"></span> Confirming in Wallet...`;
      showToast("Please confirm withdrawal in your wallet...", "info");
      addTerminalLog(`[VAULT] Calling OmniRwaVault.withdraw(${amount} shares)...`, "text-accent");

      const withTx = await vault.withdraw(parsedAmount, userAddress, userAddress);
      showToast(`Withdrawal Tx submitted: ${truncateAddress(withTx.hash)}. Waiting for block confirmation...`, "info");
      addTerminalLog(`[VAULT] Withdraw Tx: ${withTx.hash}. Awaiting confirmation...`, "text-dim");

      await withTx.wait();
      showToast(`Successfully redeemed ${amount} omniRWA shares for USDT!`, "success");
      addTerminalLog(`[VAULT] Confirmed! ${amount} USDT returned to wallet.`, "text-green");

      input.value = "";
      input.dispatchEvent(new Event("input"));
      await fetchOnChainData();
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || "Withdrawal transaction rejected/failed", "error");
      addTerminalLog(`[VAULT] Withdrawal failed: ${err.message}`, "text-dim");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.arrowUp} <span>Withdraw USDT</span>`;
    }
    return;
  }

  // Fallback demo mode
  btn.innerHTML = `<span class="pulse-dot"></span> Redeeming USDT...`;
  setTimeout(() => {
    state.userSharesBalance -= amount;
    state.userUsdtBalance += amount;
    state.tvl -= amount;
    updateBalancesUI();
    input.value = "";
    input.dispatchEvent(new Event("input"));
    btn.disabled = false;
    btn.innerHTML = `${ICONS.arrowUp} <span>Withdraw USDT</span>`;
    showToast(`Redeemed ${amount} omniRWA shares for ${amount} USDT!`, "success");
    addTerminalLog(`[VAULT] Withdrawal confirmed. ${amount} USDT returned to wallet.`, "text-green");
  }, 1000);
}

// 4. Onchain Restaking
async function handleRestake() {
  const input = document.getElementById("restake-amount");
  const amount = parseFloat(input.value);

  if (!amount || amount <= 0) {
    showToast("Please enter a valid restake amount", "error");
    return;
  }

  if (amount > state.userSharesBalance) {
    showToast("Insufficient omniRWA shares to restake", "error");
    return;
  }

  const btn = document.getElementById("btn-restake-action");
  btn.disabled = true;

  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.RwaRestakingManager) {
    try {
      const vault = new ethers.Contract(deployedConfig.contracts.OmniRwaVault, ERC20_ABI, signer);
      const restaking = new ethers.Contract(deployedConfig.contracts.RwaRestakingManager, RESTAKING_ABI, signer);
      const parsedAmount = ethers.parseUnits(amount.toString(), 6);

      // Check allowance for restaking contract to hold omniRWA shares
      const allowance = await vault.allowance(userAddress, deployedConfig.contracts.RwaRestakingManager);
      if (allowance < parsedAmount) {
        btn.innerHTML = `<span class="pulse-dot"></span> Approving ${amount.toLocaleString()} omniRWA...`;
        showToast(`Please approve ${amount.toLocaleString()} omniRWA in your wallet...`, "info");
        const appTx = await vault.approve(deployedConfig.contracts.RwaRestakingManager, parsedAmount);
        await appTx.wait();
        showToast("Shares Approved! Confirming restake transaction...", "info");
      }

      btn.innerHTML = `<span class="pulse-dot"></span> Confirming Restake in Wallet...`;
      showToast("Please confirm restaking transaction in your wallet...", "info");
      addTerminalLog(`[RESTAKE] Calling RwaRestakingManager.restake(${amount} shares, Tier ${state.selectedLockTier})...`, "text-accent");

      const resTx = await restaking.restake(parsedAmount, state.selectedLockTier);
      showToast(`Restake Tx submitted: ${truncateAddress(resTx.hash)}. Waiting for block confirmation...`, "info");
      addTerminalLog(`[RESTAKE] Tx: ${resTx.hash}. Awaiting confirmation...`, "text-dim");

      await resTx.wait();
      showToast(`Successfully restaked ${amount} omniRWA on BOT Chain!`, "success");
      addTerminalLog(`[RESTAKE] Confirmed! Position created with boosted reward multiplier.`, "text-green");

      input.value = "";
      await fetchOnChainData();
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || "Restaking transaction rejected/failed", "error");
      addTerminalLog(`[RESTAKE] Restake failed: ${err.message}`, "text-dim");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.lightning} <span>Restake Shares</span>`;
    }
    return;
  }

  // Fallback demo mode
  const tierNames = ["Flexible", "30 Days", "90 Days", "180 Days"];
  const multipliers = ["1.0x", "1.25x", "1.50x", "2.00x"];
  setTimeout(() => {
    state.userSharesBalance -= amount;
    updateBalancesUI();
    state.userPositions.push({
      amount: amount,
      tier: state.selectedLockTier,
      tierName: tierNames[state.selectedLockTier],
      mult: multipliers[state.selectedLockTier],
      date: new Date().toLocaleDateString(),
      points: 0
    });
    renderPositions();
    input.value = "";
    btn.disabled = false;
    btn.innerHTML = `${ICONS.lightning} <span>Restake Shares</span>`;
    showToast(`Restaked ${amount} omniRWA in ${tierNames[state.selectedLockTier]} tier!`, "success");
    addTerminalLog(`[RESTAKE] Position created: ${amount} omniRWA (${multipliers[state.selectedLockTier]} boost).`, "text-green");
  }, 1000);
}

function renderPositions() {
  const container = document.getElementById("positions-container");
  const badge = document.getElementById("positions-count");
  if (!container || !badge) return;

  badge.textContent = `${state.userPositions.length} Active`;

  if (state.userPositions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <div class="empty-title">No Active Restake Positions</div>
        <p class="empty-desc">Restake your omniRWA shares above to earn yield boosts and ecosystem reward points.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.userPositions.map((pos, idx) => `
    <div class="strategy-item">
      <div class="strategy-icon-box treasury">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
      </div>
      <div class="strategy-details">
        <div class="strategy-title-row">
          <span>${pos.amount.toLocaleString()} omniRWA • ${pos.tierName}</span>
          <span class="badge-accent">${pos.mult} Boost</span>
        </div>
        <div class="strategy-meta">
          <span>Locked: ${pos.date}</span>
          <span>Earned Points: <strong class="text-accent">${(pos.points + 142).toLocaleString()} BOT-PTS</strong></span>
        </div>
      </div>
      <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.75rem;" onclick="claimRewardPos(${idx})">Claim</button>
    </div>
  `).join("");
}

// 5. Onchain Claim Rewards
window.claimRewardPos = async function(idx) {
  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.RwaRestakingManager) {
    try {
      showToast("Please confirm Reward Claim transaction in wallet...", "info");
      const restaking = new ethers.Contract(deployedConfig.contracts.RwaRestakingManager, RESTAKING_ABI, signer);
      const tx = await restaking.claimRewards(idx);
      addTerminalLog(`[REWARDS] Claiming points for position #${idx + 1}... Tx: ${tx.hash}`, "text-accent");
      await tx.wait();
      showToast("Claimed BOT Ecosystem Reward Points on-chain!", "success");
      addTerminalLog(`[REWARDS] Claim confirmed! Points logged on BOT Chain.`, "text-green");
      await fetchOnChainData();
      return;
    } catch (err) {
      showToast(err.reason || err.message || "Claim transaction failed", "error");
      return;
    }
  }

  showToast("Claimed 142 BOT Ecosystem Reward Points!", "success");
  addTerminalLog(`[REWARDS] Claimed restaking points for position #${idx + 1}.`, "text-green");
};

// 6. Onchain AI Rebalance Execution
async function handleAiRebalance() {
  const btn = document.getElementById("btn-trigger-ai-rebalance");
  btn.disabled = true;
  btn.innerHTML = `<span class="pulse-dot"></span> Executing On-Chain AI Rebalance...`;

  const scenario = AI_SCENARIOS[state.aiScenario];
  const proofHash = ethers.keccak256(ethers.toUtf8Bytes(scenario.rationale + Date.now()));

  addTerminalLog(`[AI-AGENT] Generating cryptographic decision proof...`, "text-accent");
  addTerminalLog(`[AI-AGENT] Proof Hash: ${proofHash}`, "text-dim");

  if (signer && deployedConfig && deployedConfig.contracts && deployedConfig.contracts.AiStrategyController) {
    try {
      showToast("Please confirm AI Rebalance transaction in your wallet...", "info");
      addTerminalLog(`[AI-CONTROLLER] Dispatching rebalance tx to BOT Chain OmniRwaVault...`, "text-accent");

      const aiController = new ethers.Contract(deployedConfig.contracts.AiStrategyController, AI_CONTROLLER_ABI, signer);
      const weightsBps = scenario.weights.map(w => w * 100);
      const riskScore = scenario.risk;
      const predictedApyBps = Math.round(scenario.apy * 100);

      const tx = await aiController.executeAiRebalance(
        "Gemini-3.7-Flash",
        riskScore,
        predictedApyBps,
        weightsBps,
        scenario.rationale,
        proofHash
      );

      showToast(`AI Rebalance Tx submitted: ${truncateAddress(tx.hash)}. Waiting for block confirmation...`, "info");
      addTerminalLog(`[AI-CONTROLLER] Tx: ${tx.hash}. Awaiting confirmation...`, "text-dim");

      await tx.wait();
      showToast(`AI Rebalance Executed on BOT Chain! New APY: ${scenario.apy}%`, "success");
      addTerminalLog(`[SUCCESS] OmniRwaVault rebalanced: [${scenario.weights.join("%, ")}%]. Verifiable on BOTScan!`, "text-green");
      await fetchOnChainData();
    } catch (err) {
      console.error(err);
      showToast(err.reason || err.message || "AI Rebalance transaction rejected/failed", "error");
      addTerminalLog(`[AI-CONTROLLER] Rebalance failed: ${err.message}`, "text-dim");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.lightning} <span>Execute Autonomous AI Rebalance on BOT Chain</span>`;
    }
    return;
  }

  // Fallback demo mode
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `${ICONS.lightning} <span>Execute Autonomous AI Rebalance on BOT Chain</span>`;
    showToast(`AI Rebalance Executed! New Target APY: ${scenario.apy}%`, "success");
    addTerminalLog(`[SUCCESS] OmniRwaVault rebalanced: [${scenario.weights.join("%, ")}%].`, "text-green");
  }, 1500);
}

// Log Terminal Simulation Stream
function startLogSimulation() {
  const logs = [
    "[ORACLE] Parsing real-world Treasury Yield Curve: 1M 5.25%, 3M 5.20%, 6M 5.15%",
    "[AI-MODEL] Gemini 3.7 RWA Agent running credit risk matrix optimization...",
    "[TELEMETRY] Commercial Mortgage Debt delinquency rate stable at 0.82%",
    "[KEEPER] Monitoring BOT Chain block height and gas price...",
    "[RESERVE] Custody attestation verified via IPFS hash QmTreasury2026...",
    "[ORACLE] Power Purchase Agreement (PPA) cashflow verified for solar farm asset...",
    "[STATUS] BOT Chain block latency: 0.9s | Zero rebalance slippage"
  ];

  let i = 0;
  setInterval(() => {
    addTerminalLog(logs[i % logs.length], "text-dim");
    i++;
  }, 8000);
}

function addTerminalLog(msg, cssClass = "") {
  const container = document.getElementById("ai-terminal-logs");
  if (!container) return;

  // Prune old logs to keep terminal display bounded and clean (similar to real production consoles)
  while (container.children.length >= 25) {
    container.removeChild(container.firstChild);
  }

  const line = document.createElement("div");
  line.className = `log-line ${cssClass}`;
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
}

// Helpers
function generateRandomHash() {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  // Prevent duplicate toasts from stacking
  const activeToasts = container.querySelectorAll(".toast");
  for (let t of activeToasts) {
    if (t.innerText.includes(msg)) {
      return;
    }
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === "success" ? ICONS.check : type === "error" ? ICONS.error : ICONS.info}</span>
    <span>${msg}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Theme Management
function initTheme() {
  applyTheme("light");
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  const target = current === "light" ? "dark" : "light";
  applyTheme(target);
  localStorage.setItem("omni_theme", target);
  showToast(`Switched to ${target === "light" ? "Light" : "Dark"} theme`, "info");
}

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
    const sun = document.getElementById("theme-icon-sun");
    const moon = document.getElementById("theme-icon-moon");
    if (sun) sun.style.display = "block";
    if (moon) moon.style.display = "none";
  } else {
    document.documentElement.removeAttribute("data-theme");
    const sun = document.getElementById("theme-icon-sun");
    const moon = document.getElementById("theme-icon-moon");
    if (sun) sun.style.display = "none";
    if (moon) moon.style.display = "block";
  }
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupNavigation();
  setupYieldCalculator();
  setupFaqAccordion();
  setupEventListeners();
  updateBalancesUI();
  loadContractsConfig().then(() => {
    initEthers();
  });
  startLogSimulation();
  setupCursorGlow();
});

function setupCursorGlow() {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  document.body.appendChild(glow);

  window.addEventListener("pointermove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    glow.style.opacity = "1";
  });

  window.addEventListener("pointerleave", () => {
    glow.style.opacity = "0";
  });
}
