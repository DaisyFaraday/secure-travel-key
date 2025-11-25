import { Lock } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
      <span className="font-bold text-lg text-foreground">Secure Travel Diary</span>
    </div>
  );
};
