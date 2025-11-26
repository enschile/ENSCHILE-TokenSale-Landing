'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { USDT_ABI } from '@/abis/usdt';
import { useLanguage } from '@/contexts/LanguageContext';

const USDT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || '0xdAC17F958D2ee523a2206206994597C13D831ec7') as `0x${string}`;
const USDT_DECIMALS = 6;

export function USDTBalance() {
  const { t } = useLanguage();
  const { address, isConnected } = useAccount();

  const { data: balance, isLoading, error } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000, // Actualizar cada 10 segundos
      refetchOnMount: true, // Refrescar al montar el componente
      refetchOnWindowFocus: true, // Refrescar al enfocar la ventana
    },
  });

  const formatBalance = (balanceValue: bigint | undefined): string => {
    if (!balanceValue) return '0.00';
    
    const formatted = formatUnits(balanceValue, USDT_DECIMALS);
    const num = parseFloat(formatted);
    
    // Formatear con 2 decimales y separadores de miles
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const displayBalance = isConnected && balance && typeof balance === 'bigint' ? formatBalance(balance) : '0.00';

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
      <div className="flex items-center gap-2 px-3 py-2 rounded-md">
        <Wallet
          className={cn(
            'transition-all duration-200',
            isConnected ? 'text-white' : 'text-white/70'
          )}
          style={{
            width: '20px',
            height: '20px',
          }}
        />
        <span className={cn(
          'text-sm font-medium transition-all duration-200',
          isConnected ? 'text-white' : 'text-white/70'
        )}>
          {isLoading ? '...' : `${displayBalance} ${t('common.usdt')}`}
        </span>
      </div>
    </div>
  );
}

