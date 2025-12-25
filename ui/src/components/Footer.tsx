import { useEffect, useState } from 'react';
import { TravelMemory } from '@/types/memory';
import { Globe, MapPin } from 'lucide-react';

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
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm animate-fade-in-up relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5" />
      
      <div className="container mx-auto px-4 py-4 relative z-10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-primary/50" />
            <p>
              Last Decrypted: <span className="text-foreground/70">{lastDecrypted ? lastDecrypted.title : 'None'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="w-4 h-4 text-secondary/50 animate-rotate-slow" />
            <p>© 2024 Encrypted Travel Journal</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
