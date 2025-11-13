import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MemoryMap } from '@/components/MemoryMap';
import { MemoryCard } from '@/components/MemoryCard';
import { AddMemoryDialog } from '@/components/AddMemoryDialog';
import { TravelMemory } from '@/types/memory';
import { Wallet } from 'lucide-react';

const Index = () => {
  const { isConnected } = useAccount();
  const [memories, setMemories] = useState<TravelMemory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<TravelMemory | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('travel-memories');
    if (stored) {
      setMemories(JSON.parse(stored));
    }
  }, []);

  const saveMemories = (newMemories: TravelMemory[]) => {
    setMemories(newMemories);
    localStorage.setItem('travel-memories', JSON.stringify(newMemories));
    window.dispatchEvent(new Event('memories-updated'));
  };

  const handleAddMemory = (memory: TravelMemory) => {
    saveMemories([...memories, memory]);
  };

  const handleDecrypt = (id: string, decryptedMemory: TravelMemory) => {
    saveMemories(memories.map(m => m.id === id ? decryptedMemory : m));
  };

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
              <h2 className="text-3xl font-bold text-foreground">Welcome to Your Travel Journal</h2>
              <p className="text-muted-foreground max-w-md">
                Connect your wallet to start storing and encrypting your precious travel memories.
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
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-12rem)]">
          {/* Map Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Memory Map</h2>
              <AddMemoryDialog onAdd={handleAddMemory} />
            </div>
            <div className="h-[calc(100%-4rem)] rounded-lg border border-border overflow-hidden shadow-lg">
              <MemoryMap
                memories={memories}
                onSelectMemory={setSelectedMemory}
                selectedMemory={selectedMemory}
              />
            </div>
          </div>

          {/* Memories List Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Your Memories</h2>
            <div className="h-[calc(100%-4rem)] overflow-y-auto space-y-4 pr-2">
              {memories.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No memories yet. Add your first one!
                </div>
              ) : (
                memories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onDecrypt={handleDecrypt}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
