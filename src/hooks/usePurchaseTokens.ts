'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
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

  // Leer precio del contrato
  const { data: pricePerToken, isLoading: isLoadingPrice } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'PRICE_PER_TOKEN',
    query: {
      enabled: enabled && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  // Leer balance de USDT del usuario
  const { data: usdtBalance, isLoading: isLoadingBalance, refetch: refetchUSDTBalance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: enabled && isConnected && !!address && !!USDT_CONTRACT_ADDRESS,
    },
  });

  // Leer aprobación de USDT
  const { data: allowance, isLoading: isLoadingAllowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_CONTRACT_ADDRESS,
    abi: USDT_ABI,
    functionName: 'allowance',
    args: address && TOKEN_SALE_CONTRACT_ADDRESS ? [address, TOKEN_SALE_CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: enabled && isConnected && !!address && !!USDT_CONTRACT_ADDRESS && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  // Leer tokens disponibles
  const { data: availableTokens, isLoading: isLoadingAvailable } = useReadContract({
    address: TOKEN_SALE_CONTRACT_ADDRESS,
    abi: TOKEN_SALE_ABI,
    functionName: 'getAvailableTokens',
    query: {
      enabled: enabled && !!TOKEN_SALE_CONTRACT_ADDRESS,
    },
  });

  // Calcular costo total
  const calculateTotalCost = (): bigint | null => {
    if (!pricePerToken || tokenAmount <= 0) return null;
    
    // Validar que el precio sea mayor que cero
    if (pricePerToken === BigInt(0)) return null;
    
    // Convertir tokenAmount a wei (18 decimales) como espera el contrato
    // El contrato calcula: usdtCost = (tokenAmount * PRICE_PER_TOKEN) / 1e18
    const tokenAmountWei = parseUnits(tokenAmount.toString(), ENSCL_DECIMALS);
    const oneToken = parseUnits('1', ENSCL_DECIMALS);
    
    // Aplicar la misma fórmula que el contrato
    const totalCost = (tokenAmountWei * pricePerToken) / oneToken;
    
    // Validar que el costo calculado sea mayor que cero
    if (totalCost === BigInt(0)) return null;
    
    return totalCost;
  };

  const totalCost = calculateTotalCost();

  // Verificar si necesita aprobación
  useEffect(() => {
    if (allowance !== undefined && totalCost !== null) {
      setNeedsApproval(allowance < totalCost);
    } else {
      setNeedsApproval(false);
    }
  }, [allowance, totalCost]);

  // Write contract para aprobación
  const { 
    writeContract: writeApprove, 
    data: approveHash, 
    isPending: isApproving,
    error: approveError 
  } = useWriteContract();

  // Write contract para compra
  const { 
    writeContract: writeBuyTokens, 
    data: buyHash, 
    isPending: isBuying,
    error: buyError 
  } = useWriteContract();

  // Esperar confirmación de aprobación
  const { isLoading: isWaitingApproval, isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: {
      enabled: !!approveHash,
    },
  });

  // Esperar confirmación de compra
  const { isLoading: isWaitingBuy, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
    query: {
      enabled: !!buyHash,
    },
  });

  // Calcular estados de carga y procesamiento
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

  // Refrescar allowance después de aprobación exitosa
  useEffect(() => {
    if (isApprovalSuccess) {
      refetchAllowance();
    }
  }, [isApprovalSuccess, refetchAllowance]);

  // Invalidar y refrescar balance de USDT después de compra exitosa
  useEffect(() => {
    if (isBuySuccess) {
      // Invalidar todas las queries relacionadas con el balance de USDT usando un patrón
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
      // También refrescar el balance local
      refetchUSDTBalance();

      // Invalidar todas las queries relacionadas con getAvailableTokens del contrato TokenSale
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

      // Invalidar todas las queries relacionadas con el balance de ENSCL
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
    }
  }, [isBuySuccess, queryClient, refetchUSDTBalance]);

  // Validaciones
  const validation = {
    isConnected: isConnected && !!address,
    hasBalance: usdtBalance !== undefined && totalCost !== null && usdtBalance >= totalCost,
    hasAvailableTokens: availableTokens !== undefined && tokenAmount > 0,
    tokenAmountValid: tokenAmount > 0,
    canPurchase: false,
    canApprove: false,
  };

  // Validación para aprobar: necesita estar conectado, tener balance, cantidad válida y no estar procesando
  validation.canApprove =
    validation.isConnected &&
    validation.hasBalance &&
    validation.tokenAmountValid &&
    !isApproving &&
    !isBuying &&
    !isWaitingApproval &&
    !isWaitingBuy;

  // Validación para comprar: todas las validaciones básicas + no necesita aprobación + tokens disponibles
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

  // Función para aprobar
  const approve = async () => {
    if (!address || !USDT_CONTRACT_ADDRESS || !TOKEN_SALE_CONTRACT_ADDRESS) {
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

    setError(null);
    
    try {
      // Aprobar con el monto exacto necesario para la compra
      const approveAmount = totalCost;
      
      writeApprove({
        address: USDT_CONTRACT_ADDRESS,
        abi: USDT_ABI,
        functionName: 'approve',
        args: [TOKEN_SALE_CONTRACT_ADDRESS, approveAmount],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.approveUSDTError');
      setError(errorMessage);
    }
  };

  // Función para comprar
  const purchase = async () => {
    if (!address || !TOKEN_SALE_CONTRACT_ADDRESS) {
      setError(t('errors.contractAddressesNotConfigured'));
      return;
    }

    if (tokenAmount <= 0) {
      setError(t('errors.tokenAmountMustBeGreaterThanZero'));
      return;
    }

    // Validar que el precio del token esté disponible y sea válido
    if (!pricePerToken || pricePerToken === BigInt(0)) {
      setError(t('errors.tokenPriceUnavailable'));
      return;
    }

    // Validar que el costo total se haya calculado correctamente
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
      // El contrato espera tokenAmount en wei (18 decimales)
      // Convertir tokenAmount a wei usando parseUnits, igual que en el script de prueba
      const tokenAmountWei = parseUnits(tokenAmount.toString(), ENSCL_DECIMALS);

      writeBuyTokens({
        address: TOKEN_SALE_CONTRACT_ADDRESS,
        abi: TOKEN_SALE_ABI,
        functionName: 'buyTokens',
        args: [tokenAmountWei],
      });
    } catch (err) {
      let errorMessage = t('errors.purchaseTokensError');
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        // Mejorar mensajes de error específicos
        if (err.message.includes('calculated cost is zero') || err.message.includes('cost is zero')) {
          errorMessage = t('errors.calculatedCostIsZero');
        } else if (err.message.includes('reverted')) {
          errorMessage = t('errors.transactionReverted');
        }
      }
      
      setError(errorMessage);
    }
  };

  // Función principal que maneja aprobación y compra
  const handlePurchase = async () => {
    if (needsApproval) {
      await approve();
    } else {
      await purchase();
    }
  };

  // Limpiar error cuando cambia la cantidad o cuando hay éxito
  useEffect(() => {
    if (isBuySuccess) {
      setError(null);
    }
  }, [isBuySuccess]);

  useEffect(() => {
    // Limpiar error cuando cambia la cantidad, pero no si está procesando
    if (!isProcessing) {
      setError(null);
    }
  }, [tokenAmount, isProcessing]);

  // Mejorar manejo de errores de transacciones
  useEffect(() => {
    if (buyError) {
      let errorMessage = t('errors.purchaseTokensError');
      
      if (buyError.message) {
        const message = buyError.message.toLowerCase();
        
        if (message.includes('calculated cost is zero') || message.includes('cost is zero')) {
          errorMessage = t('errors.calculatedCostIsZeroAlt');
        } else if (message.includes('reverted')) {
          // Extraer el motivo del revert si está disponible
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
    }
  }, [buyError, t]);

  useEffect(() => {
    if (approveError) {
      let errorMessage = t('errors.approveUSDTError');
      
      if (approveError.message) {
        const message = approveError.message.toLowerCase();
        
        if (message.includes('user rejected') || message.includes('user denied')) {
          errorMessage = t('errors.approvalCancelledByUser');
        } else {
          errorMessage = approveError.message;
        }
      }
      
      setError(errorMessage);
    }
  }, [approveError, t]);

  return {
    // Estados
    isLoading,
    isProcessing,
    isApproving: isApproving || isWaitingApproval,
    isBuying: isBuying || isWaitingBuy,
    needsApproval,
    error: error || null,
    
    // Validaciones
    validation,
    
    // Datos
    pricePerToken: pricePerToken ? formatUnits(pricePerToken, USDT_DECIMALS) : null,
    totalCost: totalCost ? formatUnits(totalCost, USDT_DECIMALS) : null,
    usdtBalance: usdtBalance ? formatUnits(usdtBalance, USDT_DECIMALS) : null,
    allowance: allowance ? formatUnits(allowance, USDT_DECIMALS) : null,
    availableTokens: availableTokens ? formatUnits(availableTokens, ENSCL_DECIMALS) : null,
    
    // Funciones
    approve,
    purchase,
    handlePurchase,
    
    // Éxito
    isSuccess: isBuySuccess,
    approveHash,
    buyHash,
  };
}

