export interface TravelMemory {
  id: string;
  title: string;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  notes: string;
  expenses: number;
  currency: string;
  date: string;
  encrypted: boolean;
  encryptedData?: string;
  createdAt: string;
}
