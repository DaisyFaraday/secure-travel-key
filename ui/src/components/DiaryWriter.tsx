import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenTool, Lock } from "lucide-react";
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
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
              <PenTool className="w-8 h-8" />
              Write Your Travel Diary
            </CardTitle>
            <CardDescription className="text-base">
              Write about your travel experience. Your diary will be encrypted and stored securely on-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!CONTRACT_ADDRESS && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
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
              <Textarea
                placeholder="Write about your travel experience today..."
                value={diaryText}
                onChange={(e) => setDiaryText(e.target.value)}
                className="bg-background/50 min-h-[200px]"
                maxLength={512}
              />
              <p className="text-xs text-muted-foreground">
                {diaryText.length}/512 characters
              </p>
            </div>

            {isConnected && address && (
              <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
                <p>Wallet: {address.substring(0, 6)}...{address.substring(address.length - 4)}</p>
                {CONTRACT_ADDRESS && <p>Contract: {CONTRACT_ADDRESS.substring(0, 6)}...{CONTRACT_ADDRESS.substring(CONTRACT_ADDRESS.length - 4)}</p>}
              </div>
            )}

            {message && (
              <div className={`rounded-lg p-4 ${
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
              className="w-full gap-2 bg-gradient-primary hover:opacity-90 text-primary-foreground"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Encrypting & Storing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  {isConnected ? "Create Encrypted Diary" : "Connect Wallet First"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DiaryWriter;

