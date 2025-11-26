'use client';

import { useTokenPrice } from '@/hooks/useTokenPrice';
import { useLanguage } from '@/contexts/LanguageContext';

export function TokenPrice() {
  const { t } = useLanguage();
  const { price, isLoading, error } = useTokenPrice();

  if (error) {
    return (
      <div className="text-5xl font-bold text-gradient mb-2">
        {t('errors.priceError')}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-5xl font-bold text-gradient mb-2">
        ...
      </div>
    );
  }

  return (
    <div className="text-5xl font-bold text-gradient mb-2">
      ${price.toFixed(2)}
    </div>
  );
}

