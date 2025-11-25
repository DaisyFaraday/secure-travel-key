import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TravelMemory } from '@/types/memory';
import { decryptData } from '@/lib/encryption';
import { Lock, Unlock, MapPin, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryCardProps {
  memory: TravelMemory;
  onDecrypt: (id: string, decryptedMemory: TravelMemory) => void;
}

export const MemoryCard = ({ memory, onDecrypt }: MemoryCardProps) => {
  const [password, setPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleDecrypt = async () => {
    if (!password || !memory.encryptedData) return;
    
    setIsDecrypting(true);
    try {
      const decryptedJson = await decryptData(memory.encryptedData, password);
      const decryptedData = JSON.parse(decryptedJson);
      
      const decryptedMemory: TravelMemory = {
        ...memory,
        ...decryptedData,
        encrypted: false,
        encryptedData: undefined,
      };
      
      onDecrypt(memory.id, decryptedMemory);
      setOpen(false);
      setPassword('');
      toast.success('Memory decrypted successfully!');
    } catch (error) {
      toast.error('Failed to decrypt. Check your password.');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {memory.encrypted ? <Lock className="w-4 h-4 text-amber" /> : <Unlock className="w-4 h-4 text-secondary" />}
              {memory.encrypted ? 'Encrypted Memory' : memory.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {memory.location.name}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      {!memory.encrypted && (
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{memory.notes}</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-accent" />
              <span>{memory.expenses} {memory.currency}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{new Date(memory.date).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      )}
      
      <CardFooter>
        {memory.encrypted ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Unlock className="w-4 h-4 mr-2" />
                Decrypt Memory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Decrypt Memory</DialogTitle>
                <DialogDescription>
                  Enter your password to decrypt this travel memory.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter decryption password"
                    onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleDecrypt} disabled={isDecrypting || !password}>
                  {isDecrypting ? 'Decrypting...' : 'Decrypt'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <p className="text-xs text-muted-foreground w-full text-center">
            Memory is decrypted and visible
          </p>
        )}
      </CardFooter>
    </Card>
  );
};
