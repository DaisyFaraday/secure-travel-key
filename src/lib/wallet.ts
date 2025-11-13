import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Encrypted Travel Journal',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: false,
});
