import { useEffect, useState } from 'react';
import { TravelMemory } from '@/types/memory';

export const Footer = () => {
  const [lastDecrypted, setLastDecrypted] = useState<TravelMemory | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      const memories = localStorage.getItem('travel-memories');
      if (memories) {
        const parsed: TravelMemory[] = JSON.parse(memories);
        const decrypted = parsed.filter(m => !m.encrypted).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setLastDecrypted(decrypted || null);
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('memories-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('memories-updated', handleStorageChange);
    };
  }, []);

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Last Decrypted Memory: {lastDecrypted ? lastDecrypted.title : 'None'}
          </p>
          <p className="text-muted-foreground">
            © 2024 Encrypted Travel Journal
          </p>
        </div>
      </div>
    </footer>
  );
};
