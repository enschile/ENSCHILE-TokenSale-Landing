'use client';

import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Progress } from '@/components/ui/progress';
import { TOKEN_SALE_ABI } from '@/abis/tokenSale';
import { useLanguage } from '../contexts/LanguageContext';

const TOKEN_SALE_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ADDRESS || '') as `0x${string}`;
const ENSCL_DECIMALS = 18;

// Leer NEXT_PUBLIC_INITIAL_TOKEN_SUPPLY del entorno y convertirlo a BigInt con 18 decimales
const INITIAL_TOKEN_SUPPLY_RAW = process.env.NEXT_PUBLIC_INITIAL_TOKEN_SUPPLY || '0';
const INITIAL_TOKEN_SUPPLY = BigInt(INITIAL_TOKEN_SUPPLY_RAW) * BigInt(10 ** ENSCL_DECIMALS);

export function SaleProgress() {
  const { t } = useLanguage();

  // Leer tokens disponibles (balance actual del contrato TokenSale)
  const { data: availableTokens, isLoading: isLoadingAvailable } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'getAvailableTokens',
    query: {
      enabled: !!TOKEN_SALE_CONTRACT_ADDRESS,
      refetchInterval: 10000, // Actualizar cada 10 segundos
      refetchOnMount: true, // Refrescar al montar el componente
      refetchOnWindowFocus: true, // Refrescar al enfocar la ventana
    },
  });

  const formatTokens = (tokens: bigint | undefined): number => {
    if (!tokens) return 0;
    const formatted = formatUnits(tokens, ENSCL_DECIMALS);
    return parseFloat(formatted);
  };

  const total = formatTokens(INITIAL_TOKEN_SUPPLY);
  const available = formatTokens(availableTokens);
  const sold = total > 0 ? total - available : 0;
  const remaining = available;
  const percentageSold = total > 0 ? (sold / total) * 100 : 0;

  const isLoading = isLoadingAvailable;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-cyan-400">...</span>
          <span className="text-muted-foreground">...</span>
        </div>
        <Progress value={0} color="primary" variant="lg" />
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t('home.saleProgress.sold')}</span>
          <span className="font-bold text-cyan-400">0% {t('home.saleProgress.ofTotal')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-cyan-400">{sold.toLocaleString()} ENSCL</span>
        <span className="text-muted-foreground">{remaining.toLocaleString()} {t('home.saleProgress.remaining')}</span>
      </div>
      <Progress value={percentageSold} color="primary" variant="lg" />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{t('home.saleProgress.sold')}</span>
        <span className="font-bold text-cyan-400">{percentageSold.toFixed(1)}% {t('home.saleProgress.ofTotal')}</span>
      </div>
    </div>
  );
}

