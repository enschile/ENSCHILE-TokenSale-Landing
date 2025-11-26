'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { TOKEN_SALE_ABI } from '@/abis/tokenSale';

const TOKEN_SALE_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ADDRESS || '') as `0x${string}`;
const USDT_DECIMALS = 6;

export function useTokenPrice() {
  const { data: price, isLoading, error } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'PRICE_PER_TOKEN',
    query: {
      enabled: !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  const formatPrice = (priceValue: bigint | undefined): number => {
    if (!priceValue) return 0;
    
    const formatted = formatUnits(priceValue, USDT_DECIMALS);
    return parseFloat(formatted);
  };

  return {
    price: formatPrice(price),
    isLoading,
    error,
  };
}

