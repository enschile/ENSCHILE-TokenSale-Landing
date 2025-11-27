'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useLanguage } from '../contexts/LanguageContext';
import { TOKEN_SALE_ABI } from '@/abis/tokenSale';

const TOKEN_SALE_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ADDRESS || '') as `0x${string}`;
const ENSCL_DECIMALS = 18;

export function MintLive() {
  const { t } = useLanguage();

  const { data: availableTokens, isLoading: isLoadingAvailable } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'getAvailableTokens',
    query: {
      enabled: !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  const formatTokens = (tokens: bigint | undefined): number => {
    if (!tokens) return 0;
    const formatted = formatUnits(tokens, ENSCL_DECIMALS);
    return parseFloat(formatted);
  };

  const remaining = formatTokens(availableTokens);
  const isClosed = !isLoadingAvailable && remaining === 0;

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
      <div className="flex items-center gap-2 px-3 py-2">
        {isClosed ? (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></div>
            <span className="text-sm font-medium text-white">{t('common.mintClosed')}</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse"></div>
            <span className="text-sm font-medium text-white">{t('common.mintLive')}</span>
          </>
        )}
      </div>
    </div>
  );
}

