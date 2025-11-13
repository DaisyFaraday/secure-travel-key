import { Luggage } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Luggage className="w-8 h-8 text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full border-2 border-accent animate-pulse" />
        </div>
      </div>
      <span className="font-bold text-lg text-foreground">Travel Journal</span>
    </div>
  );
};
