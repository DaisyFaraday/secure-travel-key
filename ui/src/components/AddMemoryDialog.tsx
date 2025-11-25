import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { TravelMemory } from '@/types/memory';
import { encryptData } from '@/lib/encryption';
import { toast } from 'sonner';

interface AddMemoryDialogProps {
  onAdd: (memory: TravelMemory) => void;
}

export const AddMemoryDialog = ({ onAdd }: AddMemoryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [notes, setNotes] = useState('');
  const [expenses, setExpenses] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [shouldEncrypt, setShouldEncrypt] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title || !locationName || !lat || !lng) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (shouldEncrypt && !password) {
      toast.error('Please enter a password for encryption');
      return;
    }

    setIsSubmitting(true);
    try {
      const memoryData = {
        title,
        location: {
          name: locationName,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
        },
        notes,
        expenses: parseFloat(expenses) || 0,
        currency,
        date,
      };

      const newMemory: TravelMemory = {
        id: Date.now().toString(),
        ...memoryData,
        encrypted: shouldEncrypt,
        createdAt: new Date().toISOString(),
      };

      if (shouldEncrypt) {
        const encryptedData = await encryptData(JSON.stringify(memoryData), password);
        newMemory.encryptedData = encryptedData;
        newMemory.title = 'Encrypted Memory';
        newMemory.notes = '';
        newMemory.expenses = 0;
      }

      onAdd(newMemory);
      
      // Reset form
      setTitle('');
      setLocationName('');
      setLat('');
      setLng('');
      setNotes('');
      setExpenses('');
      setCurrency('USD');
      setDate(new Date().toISOString().split('T')[0]);
      setShouldEncrypt(false);
      setPassword('');
      setOpen(false);
      
      toast.success('Memory added successfully!');
    } catch (error) {
      toast.error('Failed to add memory');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Add Memory
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Travel Memory</DialogTitle>
          <DialogDescription>
            Create a new travel memory with location, notes, and expenses.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Visit to Eiffel Tower"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location Name *</Label>
              <Input
                id="location"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Paris, France"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude *</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g., 48.8584"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lng">Longitude *</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="e.g., 2.2945"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write about your experience..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expenses">Expenses</Label>
              <Input
                id="expenses"
                type="number"
                step="0.01"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-4 border-t">
            <Label htmlFor="encrypt" className="flex flex-col space-y-1">
              <span>Encrypt this memory</span>
              <span className="text-xs text-muted-foreground font-normal">
                Keep your data private with encryption
              </span>
            </Label>
            <Switch
              id="encrypt"
              checked={shouldEncrypt}
              onCheckedChange={setShouldEncrypt}
            />
          </div>

          {shouldEncrypt && (
            <div className="space-y-2">
              <Label htmlFor="password">Encryption Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
              />
              <p className="text-xs text-muted-foreground">
                Remember this password! You'll need it to decrypt the memory later.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Memory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
