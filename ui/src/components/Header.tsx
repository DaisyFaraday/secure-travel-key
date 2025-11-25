import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Logo } from './Logo';

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold text-foreground hidden md:block">
              Secure Travel Diary
            </h1>
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
