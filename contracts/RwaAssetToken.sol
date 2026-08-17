// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RwaAssetToken
 * @dev Tokenized representation of a Real World Asset class on BOT Chain.
 * Tracks Asset NAV, APY rate in basis points, and off-chain custody/attestation hash.
 */
contract RwaAssetToken is ERC20, Ownable {
    uint8 private _customDecimals;
    
    // Annual Percentage Yield in basis points (100 bps = 1.00%)
    uint256 public baseApyBps;
    
    // Net Asset Value per full token scaled to 1e6 (e.g. 1.00 USDT = 1_000_000)
    uint256 public navPrice; 
    
    // IPFS / Arweave / Sha256 hash of the off-chain custody & legal attestation
    string public legalAttestationHash;
    
    // Asset class category (e.g. "US_TREASURY", "REAL_ESTATE_DEBT", "GREEN_BONDS")
    string public assetCategory;

    event YieldRateUpdated(uint256 oldApyBps, uint256 newApyBps);
    event NavUpdated(uint256 oldNav, uint256 newNav);
    event LegalAttestationUpdated(string newHash);

    constructor(
        string memory name,
        string memory symbol,
        uint8 customDecimals_,
        uint256 initialApyBps,
        uint256 initialNav,
        string memory category_,
        string memory attestationHash_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _customDecimals = customDecimals_;
        baseApyBps = initialApyBps;
        navPrice = initialNav;
        assetCategory = category_;
        legalAttestationHash = attestationHash_;
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    function setBaseApy(uint256 newApyBps) external onlyOwner {
        emit YieldRateUpdated(baseApyBps, newApyBps);
        baseApyBps = newApyBps;
    }

    function setNavPrice(uint256 newNav) external onlyOwner {
        emit NavUpdated(navPrice, newNav);
        navPrice = newNav;
    }

    function setLegalAttestation(string calldata newHash) external onlyOwner {
        legalAttestationHash = newHash;
        emit LegalAttestationUpdated(newHash);
    }
}
