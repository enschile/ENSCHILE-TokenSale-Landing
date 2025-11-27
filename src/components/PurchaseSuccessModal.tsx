'use client';

import { useEffect, useState } from 'react';
import { useChainId } from 'wagmi';
import { CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { getEtherscanTxUrl, isEtherscanAvailable } from '@/lib/etherscan';

const ENSCL_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ENSCL_CONTRACT_ADDRESS || '') as `0x${string}`;
const ENSCL_DECIMALS = 18;

interface PurchaseSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionHash: string | undefined;
  tokensPurchased: number;
  totalCost: string | null;
}

export function PurchaseSuccessModal({
  open,
  onOpenChange,
  transactionHash,
  tokensPurchased,
  totalCost,
}: PurchaseSuccessModalProps) {
  const { t } = useLanguage();
  const chainId = useChainId();
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!open) return;

    let interval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    timeoutId = setTimeout(() => {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      
      const defaults = { 
        startVelocity: 30, 
        spread: 360, 
        ticks: 60, 
        zIndex: 10000,
        colors: ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
        gravity: 0.8,
      };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      confetti({
        ...defaults,
        particleCount: 150,
        angle: 60,
        spread: 55,
        origin: { x: 0.5, y: 0.5 },
      });
      
      confetti({
        ...defaults,
        particleCount: 150,
        angle: 120,
        spread: 55,
        origin: { x: 0.5, y: 0.5 },
      });

      interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }, 150);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (interval) clearInterval(interval);
    };
  }, [open]);

  const handleAddToMetaMask = async () => {
    if (!window.ethereum) {
      alert(t('home.ensclBalance.metaMaskNotFound'));
      return;
    }

    setIsAdding(true);
    try {
      await window.ethereum.request({
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
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
      alert(t('home.ensclBalance.addError'));
    } finally {
      setIsAdding(false);
    }
  };

  const etherscanUrl = transactionHash ? getEtherscanTxUrl(transactionHash, chainId) : null;
  const canViewOnEtherscan = isEtherscanAvailable(chainId) && etherscanUrl !== null;
  
  const getTransactionUrl = (hash: string) => {
    if (etherscanUrl) return etherscanUrl;
    return `https://etherscan.io/tx/${hash}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-ES');
  };

  const formatCurrency = (num: string): string => {
    const parsed = parseFloat(num);
    return parsed.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const truncateHash = (hash: string): string => {
    if (!hash) return '';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
              {t('home.purchaseSuccess.title')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {t('home.purchaseSuccess.congratulations')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {t('home.purchaseSuccess.summary')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <span className="text-sm text-muted-foreground">
                  {t('home.purchaseSuccess.tokensPurchased')}
                </span>
                <span className="text-lg font-bold text-cyan-400">
                  {formatNumber(tokensPurchased)} ENSCL
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <span className="text-sm text-muted-foreground">
                  {t('home.purchaseSuccess.totalCost')}
                </span>
                <span className="text-lg font-bold text-cyan-400">
                  {totalCost ? `$${formatCurrency(totalCost)} USDT` : '...'}
                </span>
              </div>
              {transactionHash && (
                <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <span className="text-sm text-muted-foreground">
                    {t('home.purchaseSuccess.transactionHash')}
                  </span>
                  <a
                    href={getTransactionUrl(transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-cyan-400 hover:text-cyan-300 hover:underline transition-colors flex items-center gap-1"
                  >
                    {truncateHash(transactionHash)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-3">
            {canViewOnEtherscan && etherscanUrl && (
              <Button
                variant="outline"
                className="flex-1 border-cyan-500/30 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200"
                asChild
              >
                <a
                  href={etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2"
                >
                  {t('home.purchaseSuccess.viewOnEtherscan')}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 border-cyan-500/30 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200"
              onClick={handleAddToMetaMask}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isAdding ? t('home.purchaseSuccess.adding') : t('home.purchaseSuccess.addToMetaMask')}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
            variant="default"
          >
            {t('home.purchaseSuccess.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

