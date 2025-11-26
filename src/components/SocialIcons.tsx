'use client';

import { Twitter, Github, Instagram, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

export function SocialIcons() {
  const { t } = useLanguage();
  const socialLinks = [
    { name: t('common.socialNetworks.twitter'), icon: Twitter, url: 'https://x.com/enschile' },
    { name: t('common.socialNetworks.github'), icon: Github, url: 'https://github.com/enschile' },
    { name: t('common.socialNetworks.instagram'), icon: Instagram, url: 'https://instagram.com/enschile.eth' },
    { name: t('common.socialNetworks.telegram'), icon: Send, url: 'https://t.me/ENSChileDAO' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
      {socialLinks.map((social) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center px-3 py-2 rounded-md transition-all duration-200 text-white/70 hover:text-white hover:bg-white/10'
            )}
            aria-label={social.name}
          >
            <Icon
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          </a>
        );
      })}
    </div>
  );
}

