'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits, isAddress } from 'viem';
import { toast } from 'sonner';
import { TOKEN_SALE_ABI } from '@/abis/tokenSale';
import { USDT_ABI } from '@/abis/usdt';
import { ENSCL_ABI } from '@/abis/enscl';
import { useLanguage } from '@/contexts/LanguageContext';

const TOKEN_SALE_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ADDRESS || '') as `0x${string}`;
const USDT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_USDT_CONTRACT_ADDRESS || '') as `0x${string}`;
const ENSCL_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ENSCL_CONTRACT_ADDRESS || '') as `0x${string}`;
const USDT_DECIMALS = 6;
const ENSCL_DECIMALS = 18;

interface UsePurchaseTokensParams {
  tokenAmount: number;
  enabled?: boolean;
}

export function usePurchaseTokens({ tokenAmount, enabled = true }: UsePurchaseTokensParams) {
  const { t } = useLanguage();
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [needsApproval, setNeedsApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingApprovalAmount, setPendingApprovalAmount] = useState<bigint | null>(null);
  const approvalToastIdRef = useRef<string | number | null>(null);
  const purchaseToastIdRef = useRef<string | number | null>(null);

  const { data: pricePerToken, isLoading: isLoadingPrice } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'PRICE_PER_TOKEN',
    query: {
      enabled: enabled && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  const { data: usdtBalance, isLoading: isLoadingBalance, refetch: refetchUSDTBalance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && isConnected && !!address && !!USDT_CONTRACT_ADDRESS,
    },
  });

  const { data: allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: address && TOKEN_SALE_CONTRACT_ADDRESS ? [address, TOKEN_SALE_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: enabled && isConnected && !!address && !!USDT_CONTRACT_ADDRESS && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  const { data: availableTokens, isLoading: isLoadingAvailable } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'getAvailableTokens',
    query: {
      enabled: enabled && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  const calculateTotalCost = (): bigint | null => {
    if (!pricePerToken || tokenAmount <= 0) return null;
    
    if (pricePerToken === BigInt(0)) return null;
    
    const tokenAmountWei = parseUnits(tokenAmount.toString(), ENSCL_DECIMALS);
    const oneToken = parseUnits('1', ENSCL_DECIMALS);
    
    const totalCost = (tokenAmountWei * pricePerToken) / oneToken;
    
    if (totalCost === BigInt(0)) return null;
    
    return totalCost;
  };

  const totalCost = calculateTotalCost();

  useEffect(() => {
    if (allowance !== undefined && totalCost !== null) {
      setNeedsApproval(allowance < totalCost);
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, totalCost]);

  const { data: approveSimulation, error: approveSimulationError } = useSimulateContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'approve',
    args: totalCost !== null && TOKEN_SALE_CONTRACT_ADDRESS ? [TOKEN_SALE_CONTRACT_ADDRESS, totalCost] : undefined,
    query: {
      enabled: !!USDT_CONTRACT_ADDRESS && !!TOKEN_SALE_CONTRACT_ADDRESS && totalCost !== null && totalCost > BigInt(0) && isConnected && !!address && !pendingApprovalAmount,
    },
  });

  const { data: resetSimulation, error: resetSimulationError } = useSimulateContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'approve',
    args: TOKEN_SALE_CONTRACT_ADDRESS ? [TOKEN_SALE_CONTRACT_ADDRESS, BigInt(0)] : undefined,
    query: {
      enabled: !!USDT_CONTRACT_ADDRESS && !!TOKEN_SALE_CONTRACT_ADDRESS && isConnected && !!address && allowance !== undefined && allowance > BigInt(0) && !pendingApprovalAmount,
    },
  });

  const { 
    writeContract: writeApprove, 
    data: approveHash, 
    isPending: isApproving,
    error: approveError 
  } = useWriteContract();

  const { 
    writeContract: writeBuyTokens, 
    data: buyHash, 
    isPending: isBuying,
    error: buyError 
  } = useWriteContract();

  const { isLoading: isWaitingApproval, isSuccess: isApprovalSuccess, error: approvalWaitError } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: {
      enabled: !!approveHash,
    },
  });

  // Toast para cuando se inicia la aprobación
  useEffect(() => {
    if (approveHash && !approvalToastIdRef.current) {
      const toastId = toast.info(t('toasts.approval.initiated'), {
        duration: 3000,
      });
      approvalToastIdRef.current = toastId;
    }
  }, [approveHash, t]);

  // Toast para cuando está esperando confirmación de aprobación
  useEffect(() => {
    if (approveHash && isWaitingApproval && approvalToastIdRef.current) {
      toast.dismiss(approvalToastIdRef.current);
      approvalToastIdRef.current = toast.loading(t('toasts.approval.pending'), {
        duration: Infinity,
      });
    }
  }, [approveHash, isWaitingApproval, t]);

  // Toast cuando la aprobación es exitosa
  useEffect(() => {
    if (isApprovalSuccess && approvalToastIdRef.current) {
      toast.dismiss(approvalToastIdRef.current);
      approvalToastIdRef.current = null;
      toast.success(t('toasts.approval.success'), {
        duration: 5000,
      });
    }
  }, [isApprovalSuccess, t]);

  // Toast cuando hay error en la aprobación durante la espera
  useEffect(() => {
    if (approvalWaitError && approvalToastIdRef.current) {
      toast.dismiss(approvalToastIdRef.current);
      approvalToastIdRef.current = null;
      const errorMessage = approvalWaitError.message?.toLowerCase() || '';
      let translatedError = t('toasts.approval.error');
      if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
        translatedError = t('errors.approvalCancelledByUser');
      }
      toast.error(translatedError, {
        duration: 5000,
      });
    }
  }, [approvalWaitError, t]);


  useEffect(() => {
    if (isApprovalSuccess) {
      const handleApprovalSuccess = async () => {
        const newAllowance = await refetchAllowance();
        
        if (pendingApprovalAmount !== null && pendingApprovalAmount > BigInt(0) && writeApprove) {
          const amountToApprove = pendingApprovalAmount;
          setPendingApprovalAmount(null);
          
          writeApprove({
            address: USDT_CONTRACT_ADDRESS,
            abi: USDT_ABI,
            functionName: 'approve',
            args: [TOKEN_SALE_CONTRACT_ADDRESS, amountToApprove],
            ...(approveSimulation && { gas: approveSimulation.request.gas }),
          });
          return;
        }
        
        if (newAllowance.data !== undefined && totalCost !== null) {
          setNeedsApproval(newAllowance.data < totalCost);
        }
      };
      
      handleApprovalSuccess();
    }
  }, [isApprovalSuccess, refetchAllowance, pendingApprovalAmount, writeApprove, approveSimulation, totalCost]);

  const { isLoading: isWaitingBuy, isSuccess: isBuySuccess, error: buyWaitError } = useWaitForTransactionReceipt({
    hash: buyHash,
    query: {
      enabled: !!buyHash,
    },
  });

  // Toast para cuando se inicia la compra
  useEffect(() => {
    if (buyHash && !purchaseToastIdRef.current) {
      const toastId = toast.info(t('toasts.purchase.initiated'), {
        duration: 3000,
      });
      purchaseToastIdRef.current = toastId;
    }
  }, [buyHash, t]);

  // Toast para cuando está esperando confirmación de compra
  useEffect(() => {
    if (buyHash && isWaitingBuy && purchaseToastIdRef.current) {
      toast.dismiss(purchaseToastIdRef.current);
      purchaseToastIdRef.current = toast.loading(t('toasts.purchase.pending'), {
        duration: Infinity,
      });
    }
  }, [buyHash, isWaitingBuy, t]);

  // Toast cuando la compra es exitosa
  useEffect(() => {
    if (isBuySuccess && purchaseToastIdRef.current) {
      toast.dismiss(purchaseToastIdRef.current);
      purchaseToastIdRef.current = null;
      toast.success(t('toasts.purchase.success'), {
        duration: 5000,
      });
    }
  }, [isBuySuccess, t]);

  // Toast cuando hay error en la compra durante la espera
  useEffect(() => {
    if (buyWaitError && purchaseToastIdRef.current) {
      toast.dismiss(purchaseToastIdRef.current);
      purchaseToastIdRef.current = null;
      const errorMessage = buyWaitError.message?.toLowerCase() || '';
      let translatedError = t('toasts.purchase.error');
      if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
        translatedError = t('errors.transactionCancelledByUser');
      } else if (errorMessage.includes('reverted')) {
        translatedError = t('errors.transactionReverted');
      }
      toast.error(translatedError, {
        duration: 5000,
      });
    }
  }, [buyWaitError, t]);

  useEffect(() => {
    if (isBuySuccess) {
      const handleBuySuccess = async () => {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length > 1 &&
              typeof queryKey[0] === 'string' &&
              queryKey[0] === 'readContract' &&
              typeof queryKey[1] === 'object' &&
              queryKey[1] !== null &&
              'address' in queryKey[1] &&
              'functionName' in queryKey[1] &&
              queryKey[1].address === USDT_CONTRACT_ADDRESS &&
              queryKey[1].functionName === 'balanceOf'
            );
          },
        });
        await refetchUSDTBalance();

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length > 1 &&
              typeof queryKey[0] === 'string' &&
              queryKey[0] === 'readContract' &&
              typeof queryKey[1] === 'object' &&
              queryKey[1] !== null &&
              'address' in queryKey[1] &&
              'functionName' in queryKey[1] &&
              queryKey[1].address === TOKEN_SALE_CONTRACT_ADDRESS &&
              queryKey[1].functionName === 'getAvailableTokens'
            );
          },
        });

        queryClient.invalidateQueries({
          predicate: (query) => {
            const queryKey = query.queryKey;
            return (
              Array.isArray(queryKey) &&
              queryKey.length > 1 &&
              typeof queryKey[0] === 'string' &&
              queryKey[0] === 'readContract' &&
              typeof queryKey[1] === 'object' &&
              queryKey[1] !== null &&
              'address' in queryKey[1] &&
              'functionName' in queryKey[1] &&
              queryKey[1].address === ENSCL_CONTRACT_ADDRESS &&
              queryKey[1].functionName === 'balanceOf'
            );
          },
        });

        setError(null);
      };
      
      handleBuySuccess();
    }
  }, [isBuySuccess, queryClient, refetchUSDTBalance]);

  const isLoading = 
    isLoadingPrice || 
    isLoadingBalance || 
    isLoadingAllowance || 
    isLoadingAvailable || 
    isApproving || 
    isBuying || 
    isWaitingApproval || 
    isWaitingBuy;

  const isProcessing = isApproving || isBuying || isWaitingApproval || isWaitingBuy;

  const validation = {
    isConnected: isConnected && !!address,
    hasBalance: usdtBalance !== undefined && totalCost !== null && usdtBalance >= totalCost,
    hasAvailableTokens: availableTokens !== undefined && tokenAmount > 0,
    tokenAmountValid: tokenAmount > 0,
    canPurchase: false,
    canApprove: false,
  };

  validation.canApprove =
    validation.isConnected &&
    validation.hasBalance &&
    validation.tokenAmountValid &&
    !isApproving &&
    !isBuying &&
    !isWaitingApproval &&
    !isWaitingBuy;

  validation.canPurchase = 
    validation.isConnected &&
    validation.hasBalance &&
    validation.hasAvailableTokens &&
    validation.tokenAmountValid &&
    !needsApproval &&
    !isApproving &&
    !isBuying &&
    !isWaitingApproval &&
    !isWaitingBuy;

  const approve = async () => {
    if (!writeApprove) {
      setError(t('errors.writeContractNotAvailable'));
      return;
    }

    if (!address || !isAddress(address)) {
      setError(t('errors.invalidUserAddress'));
      return;
    }

    if (!USDT_CONTRACT_ADDRESS || !isAddress(USDT_CONTRACT_ADDRESS) || USDT_CONTRACT_ADDRESS === '0x') {
      setError(t('errors.contractAddressesNotConfigured'));
      return;
    }

    if (!TOKEN_SALE_CONTRACT_ADDRESS || !isAddress(TOKEN_SALE_CONTRACT_ADDRESS) || TOKEN_SALE_CONTRACT_ADDRESS === '0x') {
      setError(t('errors.contractAddressesNotConfigured'));
      return;
    }

    if (!pricePerToken || pricePerToken === BigInt(0)) {
      setError(t('errors.tokenPriceUnavailable'));
      return;
    }

    if (totalCost === null || totalCost === BigInt(0)) {
      setError(t('errors.cannotCalculateTotalCost'));
      return;
    }

    if (approveSimulationError) {
      const errorMessage = approveSimulationError.message?.toLowerCase() || '';
      if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
        setError(t('errors.approvalCancelledByUser'));
      } else if (errorMessage.includes('insufficient')) {
        setError(t('errors.insufficientUSDTBalance'));
      } else {
        setError(approveSimulationError.message || t('errors.approveUSDTError'));
      }
      return;
    }

    setError(null);
    
    try {
      const approveAmount = totalCost;
      
      if (typeof approveAmount !== 'bigint' || approveAmount <= BigInt(0)) {
        setError(t('errors.invalidApprovalAmount'));
        return;
      }

      if (!isAddress(TOKEN_SALE_CONTRACT_ADDRESS)) {
        setError(t('errors.invalidContractAddress'));
        return;
      }

      if (allowance !== undefined && allowance > BigInt(0)) {
        if (resetSimulationError) {
          const errorMessage = resetSimulationError.message?.toLowerCase() || '';
          if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
            setError(t('errors.approvalCancelledByUser'));
          } else {
            setError(resetSimulationError.message || t('errors.approveUSDTError'));
          }
          return;
        }

        setPendingApprovalAmount(approveAmount);
        
        const resetGasEstimate = resetSimulation?.request?.gas;
        
        writeApprove({
          address: USDT_CONTRACT_ADDRESS,
          abi: USDT_ABI,
          functionName: 'approve',
          args: [TOKEN_SALE_CONTRACT_ADDRESS, BigInt(0)],
          ...(resetGasEstimate && { gas: resetGasEstimate }),
        });
        
        return;
      }

      const gasEstimate = approveSimulation?.request?.gas;
      
      writeApprove({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [TOKEN_SALE_CONTRACT_ADDRESS, approveAmount],
        ...(gasEstimate && { gas: gasEstimate }),
      });
    } catch (err) {
      let errorMessage = t('errors.approveUSDTError');
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        if (message.includes('malformed') || message.includes('invalid') || message.includes('invalid address')) {
          errorMessage = t('errors.malformedTransaction');
        } else if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = t('errors.approvalCancelledByUser');
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const purchase = async () => {
    if (!writeBuyTokens) {
      setError(t('errors.writeContractNotAvailable'));
      return;
    }

    if (!address || !isAddress(address)) {
      setError(t('errors.invalidUserAddress'));
      return;
    }

    if (!TOKEN_SALE_CONTRACT_ADDRESS || !isAddress(TOKEN_SALE_CONTRACT_ADDRESS) || TOKEN_SALE_CONTRACT_ADDRESS === '0x') {
      setError(t('errors.contractAddressesNotConfigured'));
      return;
    }

    if (tokenAmount <= 0) {
      setError(t('errors.tokenAmountMustBeGreaterThanZero'));
      return;
    }

    if (!pricePerToken || pricePerToken === BigInt(0)) {
      setError(t('errors.tokenPriceUnavailable'));
      return;
    }

    if (totalCost === null || totalCost === BigInt(0)) {
      setError(t('errors.calculatedCostIsZero'));
      return;
    }

    if (availableTokens !== undefined) {
      const availableTokensNumber = parseFloat(formatUnits(availableTokens, ENSCL_DECIMALS));
      if (tokenAmount > availableTokensNumber) {
        setError(t('errors.onlyXTokensAvailable', { count: availableTokensNumber.toFixed(0) }));
        return;
      }
    }

    if (!validation.hasBalance) {
      setError(t('errors.insufficientUSDTBalance'));
      return;
    }

    if (needsApproval) {
      setError(t('errors.approvalRequiredFirst'));
      return;
    }

    setError(null);

    try {
      const tokenAmountWei = parseUnits(tokenAmount.toString(), ENSCL_DECIMALS);

      if (typeof tokenAmountWei !== 'bigint' || tokenAmountWei <= BigInt(0)) {
        setError(t('errors.invalidTokenAmount'));
        return;
      }

      if (!isAddress(TOKEN_SALE_CONTRACT_ADDRESS)) {
        setError(t('errors.invalidContractAddress'));
        return;
      }

      writeBuyTokens({
        address: TOKEN_SALE_CONTRACT_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'buyTokens',
        args: [tokenAmountWei],
      });
    } catch (err) {
      let errorMessage = t('errors.purchaseTokensError');
      
      if (err instanceof Error) {
        const message = err.message.toLowerCase();
        
        if (message.includes('malformed') || message.includes('invalid') || message.includes('invalid address')) {
          errorMessage = t('errors.malformedTransaction');
        } else if (message.includes('calculated cost is zero') || message.includes('cost is zero')) {
          errorMessage = t('errors.calculatedCostIsZero');
        } else if (message.includes('reverted')) {
          errorMessage = t('errors.transactionReverted');
        } else if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = t('errors.transactionCancelledByUser');
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const handlePurchase = async () => {
    if (needsApproval) {
      await approve();
    } else {
      await purchase();
    }
  };

  useEffect(() => {
    if (!isProcessing) {
      setError(null);
    }
  }, [tokenAmount, isProcessing]);

  useEffect(() => {
    if (buyError) {
      let errorMessage = t('errors.purchaseTokensError');
      
      if (buyError.message) {
        const message = buyError.message.toLowerCase();
        
        if (message.includes('malformed') || message.includes('invalid address') || message.includes('invalid arguments')) {
          errorMessage = t('errors.malformedTransaction');
        } else if (message.includes('calculated cost is zero') || message.includes('cost is zero')) {
          errorMessage = t('errors.calculatedCostIsZeroAlt');
        } else if (message.includes('reverted')) {
          const revertMatch = message.match(/reverted with reason string ['"](.*?)['"]/);
          if (revertMatch) {
            errorMessage = t('errors.transactionRevertedWithReason', { reason: revertMatch[1] });
          } else {
            errorMessage = t('errors.transactionReverted');
          }
        } else if (message.includes('insufficient')) {
          errorMessage = t('errors.insufficientBalanceForTransaction');
        } else if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = t('errors.transactionCancelledByUser');
        } else {
          errorMessage = buyError.message;
        }
      }
      
      setError(errorMessage);
      
      // Mostrar toast de error
      if (purchaseToastIdRef.current) {
        toast.dismiss(purchaseToastIdRef.current);
        purchaseToastIdRef.current = null;
      }
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  }, [buyError, t]);

  useEffect(() => {
    if (approveError) {
      let errorMessage = t('errors.approveUSDTError');
      
      if (approveError.message) {
        const message = approveError.message.toLowerCase();
        
        if (message.includes('malformed') || message.includes('invalid address') || message.includes('invalid arguments')) {
          errorMessage = t('errors.malformedTransaction');
        } else if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = t('errors.approvalCancelledByUser');
        } else {
          errorMessage = approveError.message;
        }
      }
      
      setError(errorMessage);
      
      // Mostrar toast de error
      if (approvalToastIdRef.current) {
        toast.dismiss(approvalToastIdRef.current);
        approvalToastIdRef.current = null;
      }
      toast.error(errorMessage, {
        duration: 5000,
      });
    }
  }, [approveError, t]);

  return {
    isLoading,
    isProcessing,
    isApproving: isApproving || isWaitingApproval,
    isBuying: isBuying || isWaitingBuy,
    needsApproval,
    error: error || null,
    
    validation,
    
    pricePerToken: pricePerToken ? formatUnits(pricePerToken, USDT_DECIMALS) : null,
    totalCost: totalCost ? formatUnits(totalCost, USDT_DECIMALS) : null,
    usdtBalance: usdtBalance ? formatUnits(usdtBalance, USDT_DECIMALS) : null,
    allowance: allowance ? formatUnits(allowance, USDT_DECIMALS) : null,
    availableTokens: availableTokens ? formatUnits(availableTokens, ENSCL_DECIMALS) : null,
    
    approve,
    purchase,
    handlePurchase,
    
    isSuccess: isBuySuccess,
    approveHash,
    buyHash,
  };
}

