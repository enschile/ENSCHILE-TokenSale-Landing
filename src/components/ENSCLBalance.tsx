'use client';

import { useAccount, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { Coins, Wallet, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ENSCL_ABI } from '@/abis/enscl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect } from 'react';

const ENSCL_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ENSCL_CONTRACT_ADDRESS || '') as `0x${string}`;
const ENSCL_DECIMALS = 18;

export function ENSCLBalance() {
  const { t } = useLanguage();
  const { address, isConnected } = useAccount();
  const [isAdding, setIsAdding] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  const { data: balance, isLoading, error } = useReadContract({
    address: ENSCL_CONTRACT_ADDRESS,
    abi: ENSCL_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 10000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHasMetaMask(!!window.ethereum);
    }
  }, []);

  const formatBalance = (balanceValue: bigint | undefined): string => {
    if (!balanceValue) return '0';
    
    const formatted = formatUnits(balanceValue, ENSCL_DECIMALS);
    const num = parseFloat(formatted);
    
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const handleAddToMetaMask = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      alert(t('home.ensclBalance.metaMaskNotFound'));
      return;
    }

    setIsAdding(true);
    try {
      console.log('Attempting to add token to MetaMask...');
      const wasAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: ENSCL_CONTRACT_ADDRESS,
            symbol: 'ENSCL',
            decimals: ENSCL_DECIMALS,
          },
        },
      });

      if (wasAdded) {
        console.log('Token added to MetaMask successfully');
        alert(t('home.ensclBalance.addSuccess'));
      } else {
        console.log('User rejected adding token to MetaMask');
      }
    } catch (error: any) {
      console.error('Error adding token to MetaMask:', error);
      if (error?.code !== 4001) {
        alert(t('home.ensclBalance.addError'));
      }
    } finally {
      setIsAdding(false);
    }
  };

  const displayBalance = isConnected && balance && typeof balance === 'bigint' ? formatBalance(balance) : '0';

  return (
    <Card variant="gradient" noHover className="border-blue-500/20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Ccircle cx='16' cy='16' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
             backgroundSize: '32px 32px'
           }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Coins className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-muted-foreground">{t('home.ensclBalance.balance')}:</span>
            <span className="text-lg font-semibold text-cyan-400">
              {isLoading ? '...' : `${displayBalance} ENSCL`}
            </span>
          </div>
          <Button
            onClick={handleAddToMetaMask}
            disabled={isAdding}
            variant="outline"
            size="sm"
            className="border-cyan-500/30 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAdding ? t('home.ensclBalance.adding') : t('home.ensclBalance.addToMetaMask')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

