// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Testnet/Mainnet demo stablecoin for testing OmniRWA on BOT Chain.
 * Includes a public faucet function so anyone can test depositing into vaults.
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private constant _DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 10_000 * 10 ** _DECIMALS; // 10,000 USDT per claim
    mapping(address => uint256) public lastFaucetClaim;
    uint256 public constant FAUCET_COOLDOWN = 1 minutes;

    event FaucetClaimed(address indexed recipient, uint256 amount);

    constructor() ERC20("Mock Tether USD", "USDT") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** _DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    /**
     * @notice Mint test USDT from the public faucet
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: Cooldown active"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /**
     * @notice Owner can mint arbitrary amounts for liquidity pools or testing
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
