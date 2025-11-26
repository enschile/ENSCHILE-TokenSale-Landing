/**
 * Helper functions for Etherscan URL generation
 */

const ETHERSCAN_DOMAINS: Record<number, string> = {
  1: 'etherscan.io', // Ethereum Mainnet
  11155111: 'sepolia.etherscan.io', // Sepolia Testnet
  5: 'goerli.etherscan.io', // Goerli Testnet
  137: 'polygonscan.com', // Polygon
  42161: 'arbiscan.io', // Arbitrum
  10: 'optimistic.etherscan.io', // Optimism
  43114: 'snowtrace.io', // Avalanche
  56: 'bscscan.com', // BSC
};

/**
 * Get Etherscan domain for a given chain ID
 * Returns null for unsupported chains (like local Hardhat)
 */
export function getEtherscanDomain(chainId: number | undefined): string | null {
  if (!chainId) return null;
  return ETHERSCAN_DOMAINS[chainId] || null;
}

/**
 * Build Etherscan transaction URL
 * Returns null if chain is not supported (like local Hardhat)
 */
export function getEtherscanTxUrl(txHash: string, chainId: number | undefined): string | null {
  const domain = getEtherscanDomain(chainId);
  if (!domain) return null;
  
  return `https://${domain}/tx/${txHash}`;
}

/**
 * Build Etherscan address URL
 * Returns null if chain is not supported (like local Hardhat)
 */
export function getEtherscanAddressUrl(address: string, chainId: number | undefined): string | null {
  const domain = getEtherscanDomain(chainId);
  if (!domain) return null;
  
  return `https://${domain}/address/${address}`;
}

/**
 * Check if Etherscan is available for the given chain
 */
export function isEtherscanAvailable(chainId: number | undefined): boolean {
  return getEtherscanDomain(chainId) !== null;
}

