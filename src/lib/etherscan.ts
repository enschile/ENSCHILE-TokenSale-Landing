const ETHERSCAN_DOMAINS: Record<number, string> = {
  1: 'etherscan.io',
  11155111: 'sepolia.etherscan.io',
  5: 'goerli.etherscan.io',
  137: 'polygonscan.com',
  42161: 'arbiscan.io',
  10: 'optimistic.etherscan.io',
  43114: 'snowtrace.io',
  56: 'bscscan.com',
};

export function getEtherscanDomain(chainId: number | undefined): string | null {
  if (!chainId) return null;
  return ETHERSCAN_DOMAINS[chainId] || null;
}

export function getEtherscanTxUrl(txHash: string, chainId: number | undefined): string | null {
  const domain = getEtherscanDomain(chainId);
  if (!domain) return null;
  
  return `https://${domain}/tx/${txHash}`;
}

export function getEtherscanAddressUrl(address: string, chainId: number | undefined): string | null {
  const domain = getEtherscanDomain(chainId);
  if (!domain) return null;
  
  return `https://${domain}/address/${address}`;
}

export function isEtherscanAvailable(chainId: number | undefined): boolean {
  return getEtherscanDomain(chainId) !== null;
}

