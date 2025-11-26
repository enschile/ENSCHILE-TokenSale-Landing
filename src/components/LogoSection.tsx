'use client';

import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

export const LogoSection = () => {
  const { t } = useLanguage();
  const logos = [
    { src: '/img/efp-logo.svg', alt: t('logoSection.efp') },
    { src: '/img/ens-logo.png', alt: t('logoSection.ens') },
    { src: '/img/eth-logo.png', alt: t('logoSection.ethereum') },
    { src: '/img/ethid-logo.svg', alt: t('logoSection.ethid') },
    { src: '/img/ethidentitykit-logo.svg', alt: t('logoSection.ethidentitykit') },
    { src: '/img/grails-logo.webp', alt: t('logoSection.grails') },
    { src: '/img/sign-with-ethereum-logo.png', alt: t('logoSection.signWithEthereum') },
    { src: '/img/siwe-logo.svg', alt: t('logoSection.siwe') },
    { src: '/img/tally-logo.png', alt: t('logoSection.tally') },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 items-center justify-items-center">
        {logos.map((logo, index) => (
          <div
            key={index}
            className="flex items-center justify-center w-full h-24 p-4 rounded-lg bg-white/[0.05] border border-white/10 hover:border-cyan-500/30 hover:bg-white/[0.08] transition-all duration-300"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={120}
              height={60}
              className={`object-contain opacity-80 hover:opacity-100 transition-opacity duration-300 ${
                logo.src === '/img/ethid-logo.svg' || logo.src === '/img/eth-logo.png' ? 'brightness-0 invert' : ''
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

