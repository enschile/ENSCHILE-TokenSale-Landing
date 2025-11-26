'use client';

import ReactCountryFlag from 'react-country-flag';
import { useLanguage } from '../contexts/LanguageContext';
import { Locale } from '../i18n';
import { cn } from '@/lib/utils';

export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();

  const languages: { code: Locale; countryCode: string; name: string }[] = [
    { code: 'en', countryCode: 'US', name: t('common.languageNames.english') },
    { code: 'es', countryCode: 'ES', name: t('common.languageNames.spanish') },
  ];

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200',
            locale === lang.code
              ? 'bg-white/20 text-white shadow-lg'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          )}
          aria-label={`Switch to ${lang.name}`}
        >
          <ReactCountryFlag
            countryCode={lang.countryCode}
            svg
            style={{
              width: '20px',
              height: '20px',
            }}
            title={lang.name}
          />
          <span className="text-sm font-medium">{lang.name}</span>
        </button>
      ))}
    </div>
  );
}

