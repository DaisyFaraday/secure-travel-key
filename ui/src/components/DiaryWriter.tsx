import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useTravelDiary } from "@/hooks/useTravelDiary";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const DiaryWriter = () => {
  const { toast } = useToast();
  const { isConnected, address } = useAccount();
  const [diaryText, setDiaryText] = useState("");
  const { createDiary, isLoading, message } = useTravelDiary(CONTRACT_ADDRESS);
  const [isFocused, setIsFocused] = useState(false);

  const handleCreateDiary = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to create a diary entry.",
        variant: "destructive",
      });
      return;
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Contract Not Configured",
        description: "Please set VITE_CONTRACT_ADDRESS in your .env.local file.",
        variant: "destructive",
      });
      return;
    }

    if (!diaryText.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter some text for your diary entry.",
        variant: "destructive",
      });
      return;
    }

    if (diaryText.length > 512) {
      toast({
        title: "Text Too Long",
        description: "Diary entry must be 512 characters or less.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createDiary(diaryText);
      toast({
        title: "Diary Created Successfully! 🎉",
        description: "Your diary entry has been encrypted and stored on-chain.",
      });
      setDiaryText("");
    } catch (error: any) {
      console.error("[DiaryWriter] Error creating diary:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create diary entry.",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card className={`border-border bg-card/80 backdrop-blur hover-lift transition-all duration-500 ${
          isFocused ? 'ring-2 ring-primary/30 shadow-xl shadow-primary/10' : ''
        }`}>
          <CardHeader className="relative overflow-hidden">
            {/* 装饰性闪光效果 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-accent/40 animate-pulse-glow" />
            </div>
            
            <CardTitle className="text-3xl bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent flex items-center gap-2 relative z-10">
              <div className="p-2 rounded-lg bg-primary/10 animate-bounce-gentle">
                <PenTool className="w-8 h-8 text-primary" />
              </div>
              Write Your Travel Diary
            </CardTitle>
            <CardDescription className="text-base relative z-10">
              Write about your travel experience. Your diary will be encrypted and stored securely on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!CONTRACT_ADDRESS && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 animate-fade-in-scale">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ Contract address not configured. Please set VITE_CONTRACT_ADDRESS in your .env.local file.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent" />
                Your Diary Entry
              </label>
              <div className="relative">
                <Textarea
                  placeholder="Write about your travel experience today..."
                  value={diaryText}
                  onChange={(e) => setDiaryText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="bg-background/50 min-h-[200px] transition-all duration-300 focus:shadow-lg focus:shadow-primary/5"
                  maxLength={512}
                />
                {/* 字符计数进度条 */}
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        diaryText.length > 450 ? 'bg-destructive' : 
                        diaryText.length > 300 ? 'bg-accent' : 'bg-primary'
                      }`}
                      style={{ width: `${(diaryText.length / 512) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className={`text-xs transition-colors duration-300 ${
                diaryText.length > 450 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {diaryText.length}/512 characters
              </p>
            </div>

            {isConnected && address && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground border border-border/50 animate-fade-in-up">
                <p>Wallet: {address.substring(0, 6)}...{address.substring(address.length - 4)}</p>
                {CONTRACT_ADDRESS && <p>Contract: {CONTRACT_ADDRESS.substring(0, 6)}...{CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 4)}</p>}
              </div>
            )}

            {message && (
              <div className={`rounded-lg p-4 animate-fade-in-scale ${
                message.includes("Error") || message.includes("Missing") || message.includes("not")
                  ? "bg-destructive/10 border border-destructive/20"
                  : "bg-muted/50"
              }`}>
                <p className={`text-sm ${
                  message.includes("Error") || message.includes("Missing") || message.includes("not")
                    ? "text-destructive"
                    : "text-foreground"
                }`}>{message}</p>
              </div>
            )}

            <Button
              onClick={handleCreateDiary}
              disabled={isLoading || !isConnected}
              className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
              size="lg"
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {!isLoading && <Lock className="w-4 h-4" />}
              <span>
                {isLoading 
                  ? "Encrypting & Storing..." 
                  : isConnected 
                    ? "Create Encrypted Diary" 
                    : "Connect Wallet First"
                }
              </span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DiaryWriter;

