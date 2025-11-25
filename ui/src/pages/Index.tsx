import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import DiaryWriter from '@/components/DiaryWriter';
import DiaryList from '@/components/DiaryList';
import { Wallet } from 'lucide-react';

const Index = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-6 p-8">
            <div className="flex justify-center">
              <Wallet className="w-20 h-20 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-foreground">Welcome to Secure Travel Diary</h2>
              <p className="text-muted-foreground max-w-md">
                Connect your wallet to start storing and encrypting your travel diary entries.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        <DiaryWriter />
        <DiaryList />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
