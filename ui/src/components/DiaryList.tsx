import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, RefreshCw, Lock, Sparkles, Shield } from "lucide-react";
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
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      setExpandedId(diaryId);
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
        <Card className="border-border bg-card/80 backdrop-blur hover-lift transition-all duration-500">
          <CardHeader className="relative overflow-hidden">
            {/* 装饰性元素 */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-secondary/10 to-transparent rounded-br-full" />
            <div className="absolute -top-2 -left-2">
              <Shield className="w-6 h-6 text-secondary/40 animate-pulse-glow" />
            </div>
            
            <CardTitle className="text-3xl bg-gradient-to-r from-secondary via-primary to-secondary bg-clip-text text-transparent flex items-center gap-2 relative z-10">
              <div className="p-2 rounded-lg bg-secondary/10 animate-bounce-gentle">
                <BookOpen className="w-8 h-8 text-secondary" />
              </div>
              Your Travel Diaries
            </CardTitle>
            <CardDescription className="text-base relative z-10">
              View and decrypt your encrypted travel diary entries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(() => {
              if (!isConnected) {
                return (
                  <div className="text-center py-12 animate-fade-in-scale">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Please connect your wallet to view your diaries.</p>
                  </div>
                );
              }

              const isHardhatError = message && (message.includes("Cannot connect") || message.includes("Hardhat node"));
              
              if (isHardhatError) {
                return (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 animate-fade-in-scale">
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
                  <div className="text-center py-12 animate-fade-in-scale">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                      <Sparkles className="w-10 h-10 text-primary animate-pulse-glow" />
                    </div>
                    <p className="text-muted-foreground mb-2">No diary entries yet.</p>
                    <p className="text-sm text-muted-foreground/70">Create your first encrypted travel memory above!</p>
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
                      className="transition-all duration-300 hover:shadow-md"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {diaries.map((diary, index) => (
                      <Card 
                        key={diary.id} 
                        className={`border-border overflow-hidden transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 animate-fade-in-up ${
                          expandedId === diary.id ? 'ring-2 ring-primary/20' : ''
                        }`}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg transition-all duration-300 ${
                                diary.decryptedText 
                                  ? 'bg-green-500/10' 
                                  : 'bg-accent/10'
                              }`}>
                                <Lock className={`w-5 h-5 transition-colors duration-300 ${
                                  diary.decryptedText ? 'text-green-500' : 'text-accent'
                                }`} />
                              </div>
                              <div>
                                <span className="font-medium">
                                  Diary #{diary.id + 1}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {format(new Date(diary.timestamp * 1000), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                            </div>
                            {!diary.decryptedText ? (
                              <Button
                                onClick={() => handleDecrypt(diary.id)}
                                disabled={decryptingId === diary.id || isLoading}
                                variant="outline"
                                size="sm"
                                className="transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                              >
                                {decryptingId === diary.id && (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                                )}
                                {decryptingId !== diary.id && (
                                  <Eye className="w-4 h-4 mr-2" />
                                )}
                                <span>{decryptingId === diary.id ? "Decrypting..." : "Decrypt"}</span>
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  setExpandedId(null);
                                  loadDiaries();
                                }}
                                variant="outline"
                                size="sm"
                                className="transition-all duration-300 hover:bg-muted"
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                <span>Hide</span>
                              </Button>
                            )}
                          </div>

                          <div className={`transition-all duration-500 overflow-hidden ${
                            diary.decryptedText ? 'max-h-96 opacity-100' : 'max-h-20 opacity-100'
                          }`}>
                            {diary.decryptedText ? (
                              <div className="bg-gradient-to-br from-green-500/5 to-primary/5 rounded-lg p-4 border border-green-500/20 animate-fade-in-scale">
                                <div className="flex items-center gap-2 mb-3">
                                  <Eye className="w-5 h-5 text-green-500" />
                                  <span className="font-medium text-green-600 dark:text-green-400">Decrypted Content</span>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed">{diary.decryptedText}</p>
                              </div>
                            ) : (
                              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <EyeOff className="w-5 h-5" />
                                  <span>Content is encrypted. Click "Decrypt" to view.</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full w-full bg-gradient-to-r from-primary/30 via-secondary/30 to-accent/30 animate-shimmer" />
                                  </div>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {diary.encryptedTextChunks.length} chunk{diary.encryptedTextChunks.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
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

