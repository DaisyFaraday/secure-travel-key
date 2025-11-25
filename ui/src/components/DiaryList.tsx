import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, RefreshCw, Lock } from "lucide-react";
import { useAccount } from "wagmi";
import { useTravelDiary } from "@/hooks/useTravelDiary";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

const DiaryList = () => {
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const { diaries, decryptDiary, isLoading, loadDiaries, message } = useTravelDiary(CONTRACT_ADDRESS);
  const [decryptingId, setDecryptingId] = useState<number | null>(null);

  const handleDecrypt = async (diaryId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to decrypt your diary.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDecryptingId(diaryId);
      await decryptDiary(diaryId);
      toast({
        title: "Diary Decrypted Successfully! 🔓",
        description: "Your diary entry has been decrypted.",
      });
    } catch (error: any) {
      const errorMessage = error.message || "Failed to decrypt diary.";
      
      if (errorMessage.includes("not authorized") || errorMessage.includes("authorized")) {
        toast({
          title: "Decryption Not Authorized",
          description: "You need to create a diary first to get decryption permission.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Decryption Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setDecryptingId(null);
    }
  };

  const handleRefresh = async () => {
    if (!isConnected) return;
    await loadDiaries();
  };

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-border bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
              <BookOpen className="w-8 h-8" />
              Your Travel Diaries
            </CardTitle>
            <CardDescription className="text-base">
              View and decrypt your encrypted travel diary entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              if (!isConnected) {
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Please connect your wallet to view your diaries.</p>
                  </div>
                );
              }

              const isHardhatError = message && (message.includes("Cannot connect") || message.includes("Hardhat node"));
              
              if (isHardhatError) {
                return (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">
                      ⚠️ Hardhat Node Not Running
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                      {message}
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-4 text-xs space-y-2">
                      <p className="font-semibold">To fix this:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Open a new terminal</li>
                        <li>Navigate to the project root: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">cd secure-travel-key</code></li>
                        <li>Start Hardhat node: <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">npx hardhat node</code></li>
                        <li>Wait for the node to start, then refresh this page</li>
                      </ol>
                    </div>
                  </div>
                );
              }

              if (diaries.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No diary entries yet. Create your first one!</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      onClick={handleRefresh}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {diaries.map((diary) => (
                      <Card key={diary.id} className="border-border">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Lock className="w-5 h-5 text-accent" />
                              <span className="font-medium">
                                Diary #{diary.id + 1}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(diary.timestamp * 1000), "MMM dd, yyyy HH:mm")}
                              </span>
                            </div>
                            {!diary.decryptedText ? (
                              <Button
                                onClick={() => handleDecrypt(diary.id)}
                                disabled={decryptingId === diary.id || isLoading}
                                variant="outline"
                                size="sm"
                              >
                                {decryptingId === diary.id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                    Decrypting...
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Decrypt
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  // Hide decrypted text by reloading diaries
                                  loadDiaries();
                                }}
                                variant="outline"
                                size="sm"
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide
                              </Button>
                            )}
                          </div>

                          {diary.decryptedText ? (
                            <div className="bg-background rounded-lg p-4 border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-5 h-5 text-green-500" />
                                <span className="font-medium">Decrypted Content:</span>
                              </div>
                              <p className="text-foreground whitespace-pre-wrap">{diary.decryptedText}</p>
                            </div>
                          ) : (
                            <div className="bg-muted/50 rounded-lg p-4 border border-border">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <EyeOff className="w-5 h-5" />
                                <span>Content is encrypted. Click "Decrypt" to view.</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 font-mono">
                                {diary.encryptedTextChunks.length} encrypted chunk{diary.encryptedTextChunks.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DiaryList;

