# Secure Travel Key - Encrypted Travel Journal

A privacy-preserving travel diary application built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows users to securely store encrypted travel diary entries on-chain. Diary entries remain private, and only the user can decrypt and view their own entries.

## 🌐 Live Demo

**Try the application live:** [https://secure-travel-key.vercel.app/](https://secure-travel-key.vercel.app/)

## 🎥 Demo Video

**Watch the demo video:** [Demo Video](https://github.com/DaisyFaraday/secure-travel-key/blob/main/secure-travel-key.mp4)

## Features

- **🔒 Encrypted Diary Storage**: Users write travel diary entries that are encrypted using FHE before being stored on-chain
- **🔐 Private Decryption**: Only the user can decrypt and view their own diary entries using their private key
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet
- **📝 Text Encryption**: Diary text is encoded and encrypted as multiple FHE chunks (up to 512 characters)
- **🛡️ Zero-Knowledge Privacy**: Actual diary content is never revealed on-chain, only encrypted data

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension installed

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd ui && npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile contracts**

   ```bash
   npm run compile
   npm run typechain
   ```

4. **Deploy to local network**

   ```bash
   # Terminal 1: Start a local FHEVM-ready node
   npx hardhat node

   # Terminal 2: Deploy to local network
   npx hardhat deploy --network localhost

   # Copy the deployed contract address and update ui/.env.local
   # VITE_CONTRACT_ADDRESS=0x...
   ```

5. **Start frontend**

   ```bash
   cd ui
   npm run dev
   ```

6. **Connect wallet and test**

   - Open the app in your browser
   - Connect wallet to localhost network (Chain ID: 31337)
   - Write a diary entry
   - View and decrypt your diary entries

7. **Deploy to Sepolia Testnet** (after local testing)

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   
   # Update VITE_CONTRACT_ADDRESS in ui/.env.local with Sepolia address
   
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

## Project Structure

```
secure-travel-key/
├── contracts/                           # Smart contract source files
│   └── TravelDiary.sol                  # Main travel diary contract
├── deploy/                              # Deployment scripts
│   └── 001_deploy_TravelDiary.ts
├── test/                                # Test files
│   ├── TravelDiary.ts                  # Local network tests
│   └── TravelDiarySepolia.ts           # Sepolia testnet tests
├── ui/                                  # Frontend React application
│   ├── src/
│   │   ├── components/                 # React components
│   │   │   ├── DiaryWriter.tsx        # Create diary component
│   │   │   ├── DiaryList.tsx           # View and decrypt component
│   │   │   └── ui/                     # shadcn/ui components
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useTravelDiary.tsx     # Main contract interaction hook
│   │   │   └── useFhevm.tsx           # FHEVM instance management
│   │   ├── fhevm/                      # FHEVM utilities
│   │   │   ├── RelayerSDKLoader.ts    # SDK loader
│   │   │   ├── PublicKeyStorage.ts    # Public key management
│   │   │   └── internal/              # Internal FHEVM logic
│   │   └── pages/                     # Page components
│   └── public/                         # Static assets
│       ├── favicon.svg                 # App icon
│       └── logo.svg                    # App logo
├── hardhat.config.ts                   # Hardhat configuration
└── package.json                        # Dependencies and scripts
```

## Smart Contract

### TravelDiary.sol

The main smart contract that handles encrypted diary entry storage using FHEVM. The contract stores diary entries as encrypted chunks, where each chunk is an encrypted uint32 value.

#### Contract Structure

```solidity
contract TravelDiary is SepoliaConfig {
    struct DiaryEntry {
        uint256 timestamp;
        bytes32 encryptedTextHash;
        bool exists;
    }
    
    mapping(address => mapping(uint256 => DiaryEntry)) private _diaries;
    mapping(address => uint256) private _diaryCounts;
    mapping(address => mapping(uint256 => mapping(uint256 => euint32))) private _encryptedTextChunks;
    mapping(address => mapping(uint256 => uint256)) private _chunkCounts;
}
```

#### Key Functions

- **`createDiary(externalEuint32[] encryptedTextChunks, bytes[] inputProofs)`**: 
  - Accepts an array of encrypted text chunks and their corresponding input proofs
  - Validates that diary is not empty and within size limits (max 128 chunks = ~512 characters)
  - Stores encrypted chunks on-chain in nested mappings
  - Grants decryption permissions to the contract and user
  - Creates diary entry metadata with timestamp
  - Emits `DiaryCreated` event

- **`getDiaryCount(address user)`**: 
  - Returns the total number of diary entries for a specific user

- **`getDiaryEntry(address user, uint256 diaryId)`**: 
  - Returns diary entry metadata (timestamp, existence flag)

- **`getEncryptedTextChunk(address user, uint256 diaryId, uint256 chunkIndex)`**: 
  - Returns a specific encrypted text chunk for a diary entry

- **`getChunkCount(address user, uint256 diaryId)`**: 
  - Returns the number of encrypted chunks for a diary entry

#### Security Features

- **Input Proof Verification**: All encrypted inputs include cryptographic proofs that are verified by the contract before storage
- **Access Control**: Decryption permissions are granted only to the contract and the user who created the diary
- **Size Limits**: Maximum 128 chunks per diary (approximately 512 characters) to prevent gas limit issues
- **User Isolation**: Each user's diaries are stored in separate mappings, ensuring complete privacy

## Encryption & Decryption Logic

### Encryption Flow

The encryption process converts plain text diary entries into encrypted chunks that can be stored on-chain:

1. **Text Encoding** (`encodeTextToUint32Array`):
   - Diary text is encoded to UTF-8 bytes using `TextEncoder`
   - Bytes are converted to uint32 array (4 bytes per uint32)
   - Example: "Hello" → `[0x48656c6c, 0x6f000000]`

2. **Client-Side Encryption**:
   - For each uint32 value in the array:
     - Create encrypted input using FHEVM: `fhevmInstance.createEncryptedInput(contractAddress, userAddress)`
     - Add the uint32 value: `encryptedInput.add32(value)`
     - Encrypt to get handle and input proof: `await encryptedInput.encrypt()`
   - Result: Array of encrypted handles and corresponding input proofs

3. **On-Chain Submission**:
   - Encrypted chunks and proofs are submitted to `createDiary()` function
   - Contract verifies each input proof using `FHE.fromExternal()`
   - Encrypted chunks are stored in nested mappings
   - Decryption permissions are granted via `FHE.allowThis()` and `FHE.allow()`

4. **Contract Processing**:
   - Contract validates array lengths match
   - Checks diary size limits (max 128 chunks)
   - Stores encrypted chunks with user address, diary ID, and chunk index
   - Creates diary entry metadata with timestamp

### Decryption Flow

The decryption process retrieves and decrypts encrypted diary entries:

1. **Get Encrypted Chunks**:
   - Fetch chunk count: `getChunkCount(userAddress, diaryId)`
   - For each chunk index, fetch encrypted chunk: `getEncryptedTextChunk(userAddress, diaryId, chunkIndex)`

2. **Generate Decryption Keypair**:
   - Generate keypair using FHEVM: `fhevmInstance.generateKeypair()`
   - Creates public and private keys for EIP712 signature

3. **Create EIP712 Signature**:
   - Build EIP712 typed data structure with:
     - Domain: FHEVM, version, chainId, verifyingContract
     - Types: UserDecryptRequestVerification
     - Message: publicKey, contractAddresses, startTimestamp, durationDays
   - Sign with wallet: `ethersSigner.signTypedData()`

4. **Decrypt Each Chunk**:
   - For each encrypted chunk:
     - Prepare handle-contract pairs
     - Call FHEVM `userDecrypt()` method with:
       - Handle-contract pairs
       - Private key
       - Public key
       - EIP712 signature
       - Contract addresses
       - User address
       - Timestamp and duration
   - Result: Array of decrypted uint32 values

5. **Decode to Text** (`decodeUint32ArrayToText`):
   - Convert each uint32 value back to bytes (4 bytes per uint32)
   - Remove trailing zeros
   - Decode bytes to UTF-8 text using `TextDecoder`
   - Result: Original diary text

### Code Example

```typescript
// Encryption
const text = "My travel diary entry";
const uint32Array = encodeTextToUint32Array(text);
// Result: [0x4d792074, 0x72617665, ...]

for (const value of uint32Array) {
  const encryptedInput = fhevmInstance.createEncryptedInput(
    contractAddress,
    userAddress
  );
  encryptedInput.add32(value);
  const encrypted = await encryptedInput.encrypt();
  encryptedChunks.push(encrypted.handles[0]);
  inputProofs.push(encrypted.inputProof);
}

// Decryption
const decryptedValues: number[] = [];
for (let i = 0; i < chunkCount; i++) {
  const encryptedChunk = await contract.getEncryptedTextChunk(
    userAddress,
    diaryId,
    i
  );
  
  const keypair = fhevmInstance.generateKeypair();
  const signature = await signEIP712(keypair, contractAddress);
  
  const decrypted = await fhevmInstance.userDecrypt(
    [{ handle: encryptedChunk, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature,
    [contractAddress],
    userAddress,
    timestamp,
    duration
  );
  
  decryptedValues.push(Number(decrypted[encryptedChunk]));
}

const decryptedText = decodeUint32ArrayToText(decryptedValues);
```

## Testing

### Local Network Testing

```bash
# Start local Hardhat node with FHEVM support
npx hardhat node

# In another terminal, run tests
npm run test
```

Tests verify:
- Initialization state (no diaries initially)
- Diary creation with encrypted text chunks
- Multiple diary entries per user
- User isolation (separate diaries per user)
- Decryption functionality
- Chunk retrieval and counting

### Sepolia Testnet Testing

```bash
# Deploy contract first
npx hardhat deploy --network sepolia

# Then run Sepolia-specific tests
npm run test:sepolia
```

## Frontend Usage

### Components

1. **DiaryWriter**: 
   - Text area for writing diary entries (max 512 characters)
   - Real-time character counter
   - Encrypts and submits to contract
   - Shows transaction status and loading states
   - Displays wallet and contract address information

2. **DiaryList**: 
   - Displays list of diary entries with timestamps
   - Shows encrypted status badges
   - Decrypt button to view decrypted content
   - Refresh button to reload latest entries
   - Empty state when no diaries exist

### Workflow

1. **Connect Wallet**: 
   - Click Rainbow wallet button in header
   - Select network (Localhost 31337 or Sepolia)
   - Approve connection

2. **Write Diary**: 
   - Enter your travel diary text (max 512 characters)
   - Click "Create Encrypted Diary"
   - Wait for encryption and transaction confirmation
   - Diary is automatically added to the list

3. **View Diaries**: 
   - List of encrypted diary entries is displayed
   - Each entry shows timestamp and encrypted status
   - Entries are sorted by creation time

4. **Decrypt Diary**: 
   - Click "Decrypt" button on a diary entry
   - Sign EIP712 message with wallet
   - View decrypted content
   - Decrypted text is cached in component state

## Technical Details

### FHEVM Integration

- **SDK Loading**: Dynamically loads FHEVM Relayer SDK from CDN for Sepolia network
- **Instance Creation**: Creates FHEVM instance based on network:
  - Mock instance for localhost (31337)
  - Relayer instance for Sepolia testnet
- **Public Key Storage**: Uses IndexedDB to cache public keys and parameters for performance
- **Decryption Signatures**: Uses in-memory storage for EIP712 signatures

### Security Features

1. **Input Proof Verification**: All encrypted inputs include cryptographic proofs verified by the contract
2. **Access Control**: Only authorized parties (contract and user) can decrypt encrypted values via FHE permissions
3. **Privacy Preservation**: Actual diary text is never revealed on-chain, only encrypted chunks
4. **EIP712 Signatures**: Decryption requests require cryptographic signatures to prevent unauthorized access
5. **User Isolation**: Each user's data is stored in separate mappings, ensuring complete privacy

### Network Support

- **Localhost (31337)**: For development and testing with mock FHEVM
- **Sepolia Testnet (11155111)**: For public testing with Zama FHE relayer
- **Mainnet**: Ready for production deployment (with proper configuration)

### Gas Optimization

- **Chunked Storage**: Text is split into chunks to optimize gas costs
- **Batch Operations**: Multiple chunks are processed in a single transaction
- **Efficient Mappings**: Nested mappings minimize storage costs
- **Event Logging**: Events are used for efficient off-chain indexing

## Architecture

### Data Flow

```
User Input (Text)
    ↓
Text Encoding (UTF-8 → uint32[])
    ↓
FHE Encryption (uint32 → encrypted chunks)
    ↓
On-Chain Storage (encrypted chunks + proofs)
    ↓
[User requests decryption]
    ↓
EIP712 Signature
    ↓
FHE Decryption (encrypted chunks → uint32[])
    ↓
Text Decoding (uint32[] → UTF-8)
    ↓
Display Decrypted Text
```

### Component Architecture

- **useTravelDiary Hook**: Manages all contract interactions and encryption/decryption logic
- **useFhevm Hook**: Handles FHEVM instance creation and management
- **DiaryWriter Component**: Handles user input and diary creation
- **DiaryList Component**: Displays and manages diary entries

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using [Zama FHEVM](https://docs.zama.ai/fhevm)**
