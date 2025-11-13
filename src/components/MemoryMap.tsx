import { TravelMemory } from '@/types/memory';
import { MapPin } from 'lucide-react';

interface MemoryMapProps {
  memories: TravelMemory[];
  onSelectMemory: (memory: TravelMemory) => void;
  selectedMemory: TravelMemory | null;
}

export const MemoryMap = ({ memories, onSelectMemory, selectedMemory }: MemoryMapProps) => {
  // Calculate map boundaries
  const bounds = memories.reduce(
    (acc, memory) => ({
      minLat: Math.min(acc.minLat, memory.location.lat),
      maxLat: Math.max(acc.maxLat, memory.location.lat),
      minLng: Math.min(acc.minLng, memory.location.lng),
      maxLng: Math.max(acc.maxLng, memory.location.lng),
    }),
    { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
  );

  const mapWidth = 100;
  const mapHeight = 100;

  const normalizePosition = (lat: number, lng: number) => {
    const x = memories.length > 0
      ? ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * mapWidth
      : 50;
    const y = memories.length > 0
      ? ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * mapHeight
      : 50;
    return { x, y };
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-ocean-medium/20 to-teal-light/20 rounded-lg overflow-hidden">
      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Memory pins */}
      {memories.map((memory) => {
        const { x, y } = normalizePosition(memory.location.lat, memory.location.lng);
        const isSelected = selectedMemory?.id === memory.id;
        
        return (
          <button
            key={memory.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelectMemory(memory)}
          >
            <div className={`relative transition-all ${isSelected ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}>
              <MapPin
                className={`w-8 h-8 ${
                  memory.encrypted
                    ? 'text-amber fill-amber/20'
                    : 'text-primary fill-primary/20'
                } ${isSelected ? 'animate-bounce' : ''}`}
              />
              {isSelected && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-card px-2 py-1 rounded shadow-lg text-xs">
                  {memory.encrypted ? 'Encrypted' : memory.title}
                </div>
              )}
            </div>
          </button>
        );
      })}

      {memories.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            No memories yet. Add your first travel memory!
          </p>
        </div>
      )}
    </div>
  );
};
