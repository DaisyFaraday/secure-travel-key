import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';

// Local Hardhat network configuration
const localhost = {
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
} as const;

export const config = getDefaultConfig({
  appName: 'Secure Travel Key',
  projectId: 'YOUR_PROJECT_ID',
  chains: [localhost, sepolia, mainnet],
  ssr: false,
});
