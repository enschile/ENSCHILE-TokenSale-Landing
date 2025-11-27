'use client';

import { useState, useRef, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { BarChart3, DollarSign, Loader2 } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';
import { SocialIcons } from '../components/SocialIcons';
import { MintLive } from '../components/MintLive';
import { USDTBalance } from '../components/USDTBalance';
import { FAQSection } from '../components/FAQSection';
import { LogoSection } from '../components/LogoSection';
import { TokenPrice } from '../components/TokenPrice';
import { SaleProgress } from '../components/SaleProgress';
import { ENSCLBalance } from '../components/ENSCLBalance';
import { ContractCards } from '../components/ContractCards';
import { PurchaseSuccessModal } from '../components/PurchaseSuccessModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useTokenPrice } from '../hooks/useTokenPrice';
import { usePurchaseTokens } from '../hooks/usePurchaseTokens';

const Home: NextPage = () => {
  const { t } = useLanguage();
  const { isConnected } = useAccount();
  const [sliderValue, setSliderValue] = useState([1]);
  const [inputValue, setInputValue] = useState('1');
  const [marginTop, setMarginTop] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const { price: tokenPrice } = useTokenPrice();
  
  const MAX_VALUE = 50000;
  const INCREMENT_BUTTONS = [
    { label: '+100', value: 100 },
    { label: '+1K', value: 1000 },
    { label: '+5K', value: 5000 },
    { label: '+10K', value: 10000 },
  ];
  
  const formatNumber = (num: number): string => {
    return num.toLocaleString('es-ES');
  };
  
  const formatCurrency = (num: number): string => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  const parseInputValue = (value: string): number => {
    const cleaned = value.replace(/,/g, '');
    const parsed = parseInt(cleaned, 10);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const parsed = parseInputValue(value);
    if (parsed >= 0 && parsed <= MAX_VALUE) {
      setSliderValue([parsed]);
    }
  };
  
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    setInputValue(value[0].toString());
  };
  
  const handleInputBlur = () => {
    const parsed = parseInputValue(inputValue);
    const clamped = Math.max(1, Math.min(parsed, MAX_VALUE));
    setSliderValue([clamped]);
    setInputValue(clamped.toString());
  };
  
  const handleIncrement = (amount: number) => {
    const newValue = Math.min(sliderValue[0] + amount, MAX_VALUE);
    setSliderValue([newValue]);
    setInputValue(newValue.toString());
  };
  
  const {
    isLoading,
    isProcessing,
    isApproving,
    isBuying,
    needsApproval,
    error,
    validation,
    handlePurchase,
    isSuccess,
    buyHash,
    totalCost,
  } = usePurchaseTokens({
    tokenAmount: sliderValue[0],
    enabled: isConnected,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isSuccess && buyHash) {
      setShowSuccessModal(true);
    }
  }, [isSuccess, buyHash]);

  useEffect(() => {
    if (!showSuccessModal) {
      setSliderValue([1]);
      setInputValue('1');
    }
  }, [showSuccessModal]);

  useEffect(() => {
    const calculateMargin = () => {
      if (headerRef.current) {
        const headerHeight = headerRef.current.offsetHeight;
        const headerTop = headerRef.current.offsetTop;
        const totalHeight = headerHeight + headerTop;
        setMarginTop(totalHeight + 32);
      }
    };

    calculateMargin();
    window.addEventListener('resize', calculateMargin);
    return () => window.removeEventListener('resize', calculateMargin);
  }, []);

  return (
    <>
      <Head>
        <title>{t('home.title')}</title>
        <meta content={t('home.metaDescription')} name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <main className="flex flex-col relative">
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(59, 130, 246, 0.1) 10px,
              rgba(59, 130, 246, 0.1) 20px
            )`
          }}
        ></div>
        
        <div className="absolute top-4 left-4 hidden md:flex items-center gap-3 z-10">
          <MintLive />
          <SocialIcons />
        </div>
        <div className="absolute top-4 right-4 hidden md:block z-10">
          <LanguageSelector />
        </div>

        <div ref={headerRef} className="absolute top-6 left-0 right-0 flex flex-col items-center gap-4 md:top-20 md:flex-row md:justify-between md:items-center px-4 z-10">
          <Image
            src="/img/logo-enschile.png"
            alt={t('common.logoAlt')}
            width={200}
            height={60}
            className="object-contain w-64 md:w-[200px]"
          />
          <div className="flex items-center gap-3">
            <USDTBalance />
            <ConnectButton />
          </div>
          <div className="md:hidden flex flex-col items-center gap-3">
            <LanguageSelector />
            <div className="flex items-center gap-3">
              <MintLive />
              <SocialIcons />
            </div>
          </div>
        </div>

        <div className="px-4 w-full relative z-10" style={{ marginTop: `${marginTop}px` }}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="w-full lg:w-2/5 flex flex-col gap-6">
              <ENSCLBalance />

              <Card variant="gradient" noHover className="border-blue-500/20 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-0" 
                     style={{
                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Ccircle cx='16' cy='16' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                       backgroundSize: '32px 32px'
                     }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    {t('home.tokenPrice.title')}
                  </CardTitle>
                  <CardDescription>{t('home.tokenPrice.description')}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    <TokenPrice />
                    <p className="text-sm text-muted-foreground">
                      {tokenPrice > 0 
                        ? t('home.tokenPrice.equivalence', { price: tokenPrice.toFixed(2) })
                        : '...'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card variant="gradient" noHover className="border-blue-500/20 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-0" 
                     style={{
                       backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Ccircle cx='16' cy='16' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                       backgroundSize: '32px 32px'
                     }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    {t('home.saleProgress.title')}
                  </CardTitle>
                  <CardDescription>{t('home.saleProgress.description')}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <SaleProgress />
                </CardContent>
              </Card>
            </div>

            <div className="w-full lg:w-3/5">
              <Card variant="gradient" noHover className="border-blue-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    {t('home.quantitySelector.title')}
                  </CardTitle>
                  <CardDescription>{t('home.quantitySelector.description')}</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Label htmlFor="token-amount" className="text-sm font-medium mb-2 block">
                          {t('home.quantitySelector.tokenAmount')}
                        </Label>
                        <Input
                          id="token-amount"
                          type="text"
                          value={inputValue}
                          onChange={handleInputChange}
                          onBlur={handleInputBlur}
                          className="text-lg font-semibold"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                          <span className="text-2xl font-bold text-gradient">
                            {formatNumber(sliderValue[0])}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {INCREMENT_BUTTONS.map((btn) => (
                        <Button
                          key={btn.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleIncrement(btn.value)}
                          disabled={sliderValue[0] + btn.value > MAX_VALUE}
                          className="text-xs hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/30"
                        >
                          {btn.label}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={sliderValue}
                        onValueChange={handleSliderChange}
                        max={MAX_VALUE}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span className="font-semibold text-blue-400">{formatNumber(25000)}</span>
                        <span>{formatNumber(MAX_VALUE)}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('home.quantitySelector.unitPrice')}</span>
                        <span className="font-semibold">
                          {tokenPrice > 0 ? `$${tokenPrice.toFixed(2)}` : '...'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                        <span className="text-muted-foreground font-medium">{t('home.quantitySelector.estimatedTotal')}</span>
                        <span className="text-xl font-bold text-gradient">
                          {tokenPrice > 0 
                            ? `$${formatCurrency(sliderValue[0] * tokenPrice)}`
                            : '...'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 relative z-10">
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePurchase}
                    disabled={
                      !isConnected ||
                      sliderValue[0] <= 0 ||
                      isLoading ||
                      (needsApproval ? !validation.canApprove : !validation.canPurchase) ||
                      isProcessing
                    }
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {isApproving 
                          ? t('home.quantitySelector.approving')
                          : isBuying
                          ? t('home.quantitySelector.purchasing')
                          : t('home.quantitySelector.processing')
                        }
                      </span>
                    ) : needsApproval ? (
                      t('home.quantitySelector.approveUSDT')
                    ) : (
                      t('home.quantitySelector.confirmPurchase')
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>

          <LogoSection />

          <ContractCards />

          <div className="mb-8 w-full">
            <FAQSection />
          </div>
        </div>

        <PurchaseSuccessModal
          open={showSuccessModal}
          onOpenChange={setShowSuccessModal}
          transactionHash={buyHash}
          tokensPurchased={sliderValue[0]}
          totalCost={totalCost}
        />
      </main>
    </>
  );
};

export default Home;
