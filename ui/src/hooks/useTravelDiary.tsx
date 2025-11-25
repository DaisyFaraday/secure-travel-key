import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWalletClient } from "wagmi";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "./useInMemoryStorage";

// Contract ABI
const TravelDiaryABI = [
  "function createDiary(bytes32[] calldata encryptedTextChunks, bytes[] calldata inputProofs) external",
  "function getDiaryCount(address user) external view returns (uint256)",
  "function getDiaryEntry(address user, uint256 diaryId) external view returns (uint256 timestamp, bool exists)",
  "function getEncryptedTextChunk(address user, uint256 diaryId, uint256 chunkIndex) external view returns (bytes32)",
  "function getChunkCount(address user, uint256 diaryId) external view returns (uint256)",
  "event DiaryCreated(address indexed user, uint256 indexed diaryId, uint256 timestamp)",
] as const;

export interface DiaryEntry {
  id: number;
  timestamp: number;
  encryptedTextChunks: string[];
  decryptedText?: string;
}

interface UseTravelDiaryState {
  contractAddress: string | undefined;
  diaries: DiaryEntry[];
  isLoading: boolean;
  message: string | undefined;
  createDiary: (text: string) => Promise<void>;
  decryptDiary: (diaryId: number) => Promise<void>;
  loadDiaries: () => Promise<void>;
}

// Helper function to encode text to uint32 array
function encodeTextToUint32Array(text: string): number[] {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  const uint32Array: number[] = [];
  
  // Convert bytes to uint32 (4 bytes per uint32)
  for (let i = 0; i < bytes.length; i += 4) {
    let value = 0;
    for (let j = 0; j < 4 && i + j < bytes.length; j++) {
      value |= bytes[i + j] << (j * 8);
    }
    uint32Array.push(value);
  }
  
  return uint32Array;
}

// Helper function to decode uint32 array to text
function decodeUint32ArrayToText(uint32Array: number[]): string {
  const bytes: number[] = [];
  
  // Convert uint32 to bytes
  for (const value of uint32Array) {
    for (let j = 0; j < 4; j++) {
      const byte = (value >> (j * 8)) & 0xff;
      if (byte !== 0) {
        bytes.push(byte);
      }
    }
  }
  
  // Remove trailing zeros
  while (bytes.length > 0 && bytes[bytes.length - 1] === 0) {
    bytes.pop();
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(new Uint8Array(bytes));
}

export function useTravelDiary(contractAddress: string | undefined): UseTravelDiaryState {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();

  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [ethersSigner, setEthersSigner] = useState<ethers.JsonRpcSigner | undefined>(undefined);
  const [ethersProvider, setEthersProvider] = useState<ethers.JsonRpcProvider | undefined>(undefined);

  // Get EIP1193 provider
  const eip1193Provider = useCallback(() => {
    if (chainId === 31337) {
      return "http://localhost:8545";
    }
    if (walletClient?.transport) {
      const transport = walletClient.transport as any;
      if (transport.value && typeof transport.value.request === "function") {
        return transport.value;
      }
      if (typeof transport.request === "function") {
        return transport;
      }
    }
    if (typeof window !== "undefined" && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return undefined;
  }, [chainId, walletClient]);

  // Initialize FHEVM
  const { instance: fhevmInstance, status: fhevmStatus } = useFhevm({
    provider: eip1193Provider(),
    chainId,
    initialMockChains: { 31337: "http://localhost:8545" },
    enabled: isConnected && !!contractAddress,
  });

  // Convert walletClient to ethers signer
  useEffect(() => {
    if (!walletClient || !chainId) {
      setEthersSigner(undefined);
      setEthersProvider(undefined);
      return;
    }

    const setupEthers = async () => {
      try {
        const provider = new ethers.BrowserProvider(walletClient as any);
        const signer = await provider.getSigner();
        setEthersProvider(provider as any);
        setEthersSigner(signer);
      } catch (error) {
        console.error("Error setting up ethers:", error);
        setEthersSigner(undefined);
        setEthersProvider(undefined);
      }
    };

    setupEthers();
  }, [walletClient, chainId]);

  const createDiary = useCallback(
    async (text: string) => {
      if (!contractAddress || !ethersSigner || !fhevmInstance || !address || !ethersProvider) {
        throw new Error("Missing requirements for creating diary");
      }

      if (!text.trim()) {
        throw new Error("Diary text cannot be empty");
      }

      if (text.length > 512) {
        throw new Error("Diary text is too long (max 512 characters)");
      }

      try {
        setIsLoading(true);
        setMessage("Encoding and encrypting diary text...");

        // Encode text to uint32 array
        const uint32Array = encodeTextToUint32Array(text);
        
        // Encrypt each chunk
        const encryptedChunks: string[] = [];
        const inputProofs: string[] = [];
        
        for (const value of uint32Array) {
          const encryptedInput = fhevmInstance.createEncryptedInput(
            contractAddress as `0x${string}`,
            address as `0x${string}`
          );
          encryptedInput.add32(value);
          const encrypted = await encryptedInput.encrypt();
          
          encryptedChunks.push(encrypted.handles[0]);
          inputProofs.push(encrypted.inputProof);
        }

        setMessage("Submitting to blockchain...");

        // Verify contract is deployed
        const contractCode = await ethersProvider.getCode(contractAddress);
        if (contractCode === "0x" || contractCode.length <= 2) {
          throw new Error(`Contract not deployed at ${contractAddress}`);
        }

        const contract = new ethers.Contract(contractAddress, TravelDiaryABI, ethersSigner);

        const tx = await contract.createDiary(encryptedChunks, inputProofs, {
          gasLimit: 5000000,
        });
        
        const receipt = await tx.wait();
        console.log("Diary created, block:", receipt.blockNumber);

        setMessage("Diary created successfully! Refreshing...");
        
        // Wait for permissions to be set
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload diaries
        await loadDiaries();
      } catch (error: any) {
        const errorMessage = error.reason || error.message || String(error);
        setMessage(`Error: ${errorMessage}`);
        console.error("[useTravelDiary] Error creating diary:", error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [contractAddress, ethersSigner, fhevmInstance, address, ethersProvider]
  );

  const decryptDiary = useCallback(
    async (diaryId: number) => {
      if (!contractAddress || !ethersProvider || !fhevmInstance || !ethersSigner || !address) {
        setMessage("Missing requirements for decryption");
        return;
      }

      try {
        setMessage("Decrypting diary...");

        const contract = new ethers.Contract(contractAddress, TravelDiaryABI, ethersProvider);
        
        // Get chunk count
        const chunkCount = await contract.getChunkCount(address, diaryId);
        const chunkCountNum = Number(chunkCount);

        // Decrypt each chunk
        const decryptedValues: number[] = [];
        
        for (let i = 0; i < chunkCountNum; i++) {
          const encryptedChunk = await contract.getEncryptedTextChunk(address, diaryId, i);
          
          // Generate keypair for EIP712 signature
          let keypair: { publicKey: Uint8Array; privateKey: Uint8Array };
          if (typeof (fhevmInstance as any).generateKeypair === "function") {
            keypair = (fhevmInstance as any).generateKeypair();
          } else {
            keypair = {
              publicKey: new Uint8Array(32).fill(0),
              privateKey: new Uint8Array(32).fill(0),
            };
          }

          // Create EIP712 signature
          const contractAddresses = [contractAddress as `0x${string}`];
          const startTimestamp = Math.floor(Date.now() / 1000).toString();
          const durationDays = "10";

          let eip712: any;
          if (typeof (fhevmInstance as any).createEIP712 === "function") {
            eip712 = (fhevmInstance as any).createEIP712(
              keypair.publicKey,
              contractAddresses,
              startTimestamp,
              durationDays
            );
          } else {
            eip712 = {
              domain: {
                name: "FHEVM",
                version: "1",
                chainId: chainId,
                verifyingContract: contractAddresses[0],
              },
              types: {
                UserDecryptRequestVerification: [
                  { name: "publicKey", type: "bytes" },
                  { name: "contractAddresses", type: "address[]" },
                  { name: "startTimestamp", type: "string" },
                  { name: "durationDays", type: "string" },
                ],
              },
              message: {
                publicKey: ethers.hexlify(keypair.publicKey),
                contractAddresses,
                startTimestamp,
                durationDays,
              },
            };
          }

          // Sign the EIP712 message
          const signature = await ethersSigner.signTypedData(
            eip712.domain,
            { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
            eip712.message
          );

          // For local mock network, signature may need to have "0x" prefix removed
          const signatureForDecrypt = chainId === 31337 
            ? signature.replace("0x", "") 
            : signature;

          const handle = typeof encryptedChunk === "string" ? encryptedChunk : ethers.hexlify(encryptedChunk);
          const handleContractPairs = [
            { handle, contractAddress: contractAddress as `0x${string}` },
          ];

          // Decrypt using userDecrypt method
          const decryptedResult = await (fhevmInstance as any).userDecrypt(
            handleContractPairs,
            keypair.privateKey,
            keypair.publicKey,
            signatureForDecrypt,
            contractAddresses,
            address as `0x${string}`,
            startTimestamp,
            durationDays
          );

          const decryptedValue = Number(decryptedResult[handle] || 0);
          decryptedValues.push(decryptedValue);
        }

        // Decode to text
        const decryptedText = decodeUint32ArrayToText(decryptedValues);
        
        // Update diary in state
        setDiaries(prev => prev.map(d => 
          d.id === diaryId ? { ...d, decryptedText } : d
        ));
        
        setMessage("Diary decrypted successfully!");
      } catch (error: any) {
        console.error("[useTravelDiary] Error decrypting diary:", error);
        const errorMessage = error.message || String(error);
        setMessage(`Error decrypting: ${errorMessage}`);
        throw error;
      }
    },
    [contractAddress, ethersProvider, fhevmInstance, ethersSigner, address, chainId]
  );

  const loadDiaries = useCallback(async () => {
    if (!contractAddress || !ethersProvider || !address) {
      return;
    }

    try {
      setIsLoading(true);

      // Check if we can connect to the provider first
      try {
        await ethersProvider.getBlockNumber();
      } catch (providerError: any) {
        if (chainId === 31337) {
          const errorMsg = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
          setMessage(errorMsg);
          console.error("[useTravelDiary] Hardhat node not accessible:", providerError);
          return;
        } else {
          throw providerError;
        }
      }

      const contractCode = await ethersProvider.getCode(contractAddress);
      if (contractCode === "0x" || contractCode.length <= 2) {
        setMessage(`Contract not deployed at ${contractAddress}`);
        setDiaries([]);
        return;
      }

      const contract = new ethers.Contract(contractAddress, TravelDiaryABI, ethersProvider);
      const diaryCount = await contract.getDiaryCount(address);
      const diaryCountNum = Number(diaryCount);

      const loadedDiaries: DiaryEntry[] = [];
      
      for (let i = 0; i < diaryCountNum; i++) {
        const [timestamp, exists] = await contract.getDiaryEntry(address, i);
        if (exists) {
          const chunkCount = await contract.getChunkCount(address, i);
          const chunkCountNum = Number(chunkCount);
          
          const encryptedChunks: string[] = [];
          for (let j = 0; j < chunkCountNum; j++) {
            const chunk = await contract.getEncryptedTextChunk(address, i, j);
            encryptedChunks.push(typeof chunk === "string" ? chunk : ethers.hexlify(chunk));
          }
          
          loadedDiaries.push({
            id: i,
            timestamp: Number(timestamp),
            encryptedTextChunks: encryptedChunks,
          });
        }
      }

      setDiaries(loadedDiaries);
    } catch (error: any) {
      console.error("[useTravelDiary] Error loading diaries:", error);
      let errorMessage = error.message || String(error);
      
      if (error.code === "UNKNOWN_ERROR" || error.code === -32603) {
        if (chainId === 31337) {
          errorMessage = "Cannot connect to Hardhat node. Please ensure 'npx hardhat node' is running on http://localhost:8545";
        } else {
          errorMessage = `Network error: ${error.message || "Failed to connect to blockchain"}`;
        }
      }
      
      setMessage(`Error loading diaries: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, ethersProvider, address, chainId]);

  useEffect(() => {
    if (contractAddress && ethersProvider && address) {
      loadDiaries();
    }
  }, [contractAddress, ethersProvider, address, loadDiaries]);

  return {
    contractAddress,
    diaries,
    isLoading,
    message,
    createDiary,
    decryptDiary,
    loadDiaries,
  };
}

