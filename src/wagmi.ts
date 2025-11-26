import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet } from 'wagmi/chains';
import { http } from 'wagmi';

export const config = getDefaultConfig({
  appName: 'ENSCHILE',
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID || '',
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
});
