import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Logo } from './Logo';
import { Plane } from 'lucide-react';

export const Header = () => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in-down">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <Plane className="w-5 h-5 text-primary animate-bounce-gentle hidden sm:block" />
          </div>
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden md:block">
              Secure Travel Diary
            </h1>
            <div className="transition-all duration-300 hover:scale-105">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
