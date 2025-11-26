'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCode, Shield, Github, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const ContractCards = () => {
  const { t } = useLanguage();
  const ensclAddress = process.env.NEXT_PUBLIC_ENSCL_CONTRACT_ADDRESS || '';
  const tokenSaleAddress = process.env.NEXT_PUBLIC_TOKEN_SALE_CONTRACT_ADDRESS || '';
  const githubUrl = 'https://github.com/enschile';

  const etherscanBaseUrl = 'https://etherscan.io/address';

  const cards = [
    {
      id: 'enscl',
      icon: FileCode,
      title: t('contracts.enscl.title'),
      description: t('contracts.enscl.description'),
      verified: true,
      link: `${etherscanBaseUrl}/${ensclAddress}`,
      linkText: t('contracts.viewOnEtherscan'),
      bgImage: '/img/card-bg-1.jpg', // Placeholder, se puede usar gradiente CSS si no existe
      gradient: 'from-blue-600/20 via-cyan-600/20 to-blue-500/20',
    },
    {
      id: 'tokensale',
      icon: Shield,
      title: t('contracts.tokensale.title'),
      description: t('contracts.tokensale.description'),
      verified: true,
      link: `${etherscanBaseUrl}/${tokenSaleAddress}`,
      linkText: t('contracts.viewOnEtherscan'),
      bgImage: '/img/card-bg-2.jpg', // Placeholder, se puede usar gradiente CSS si no existe
      gradient: 'from-cyan-600/20 via-blue-600/20 to-purple-600/20',
    },
    {
      id: 'github',
      icon: Github,
      title: t('contracts.github.title'),
      description: t('contracts.github.description'),
      verified: false,
      link: githubUrl,
      linkText: t('contracts.viewOnGitHub'),
      bgImage: '/img/card-bg-3.jpg', // Placeholder, se puede usar gradiente CSS si no existe
      gradient: 'from-purple-600/20 via-pink-600/20 to-cyan-600/20',
    },
  ];

  return (
    <div className="w-full mb-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card
              key={card.id}
              variant="gradient"
              noHover
              className="border-blue-500/20 relative overflow-hidden group min-h-[320px]"
            >
              {/* Patrón decorativo de fondo - puntos */}
              <div className="absolute inset-0 pointer-events-none z-0" 
                   style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%233b82f6' fill-opacity='0.15'%3E%3Ccircle cx='16' cy='16' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`,
                     backgroundSize: '32px 32px'
                   }}></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 pointer-events-none z-0"></div>
              
              {/* Background Image/Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50 group-hover:opacity-70 transition-opacity duration-300 z-0`}
              />
              
              {/* Overlay for text readability */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors duration-300 z-0" />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                <CardHeader className="pb-4 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 group-hover:bg-white/15 transition-colors">
                        <IconComponent className="h-8 w-8 text-cyan-400" />
                      </div>
                      <CardTitle className="text-2xl font-semibold text-slate-50 leading-tight">
                        {card.title}
                      </CardTitle>
                    </div>
                    {card.verified && (
                      <Badge variant="success" className="flex items-center gap-1 flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('common.verified')}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-slate-200 text-base leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="outline"
                    size="default"
                    className="w-full border-cyan-500/30 bg-white/5 hover:bg-white/10 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 transition-all duration-300"
                    asChild
                  >
                    <a
                      href={card.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      {card.linkText}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

