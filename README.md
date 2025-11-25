# Secure Travel Diary - Encrypted Travel Journal

A privacy-preserving travel diary application built with FHEVM (Fully Homomorphic Encryption Virtual Machine) that allows users to securely store encrypted travel diary entries on-chain. Diary entries remain private, and only the user can decrypt and view their own entries.

## Features

- **🔒 Encrypted Diary Storage**: Users write travel diary entries that are encrypted using FHE before being stored on-chain
- **🔐 Private Decryption**: Only the user can decrypt and view their own diary entries using their private key
- **💼 Rainbow Wallet Integration**: Seamless wallet connection using RainbowKit
- **🌐 Multi-Network Support**: Works on local Hardhat network and Sepolia testnet
- **📝 Text Encryption**: Diary text is encoded and encrypted as multiple FHE chunks

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

The main smart contract that handles encrypted diary entry storage using FHEVM.

#### Key Functions

- **`createDiary(externalEuint32[] encryptedTextChunks, bytes[] inputProofs)`**: 
  - Accepts encrypted text chunks and input proofs
  - Stores encrypted chunks on-chain
  - Grants decryption permissions to the user
  - Emits `DiaryCreated` event

- **`getDiaryCount(address user)`**: 
  - Returns the number of diary entries for a user

- **`getDiaryEntry(address user, uint256 diaryId)`**: 
  - Returns diary entry metadata (timestamp, existence)

- **`getEncryptedTextChunk(address user, uint256 diaryId, uint256 chunkIndex)`**: 
  - Returns an encrypted text chunk for a diary entry

- **`getChunkCount(address user, uint256 diaryId)`**: 
  - Returns the number of chunks for a diary entry

## Encryption & Decryption Logic

### Encryption Flow

1. **Text Encoding**: Diary text is encoded to UTF-8 bytes, then converted to uint32 array (4 bytes per uint32)
2. **Client-Side Encryption**: Each uint32 value is encrypted using FHEVM
3. **On-Chain Submission**: Encrypted chunks and proofs are submitted to the contract
4. **Contract Processing**: Contract verifies proofs and stores encrypted chunks with decryption permissions

### Decryption Flow

1. **Get Encrypted Chunks**: Fetch all encrypted chunks for a diary entry
2. **Generate Decryption Keypair**: Create keypair for EIP712 signature
3. **Create EIP712 Signature**: Sign decryption request with wallet
4. **Decrypt**: Use FHEVM to decrypt each chunk
5. **Decode**: Convert decrypted uint32 array back to text

## Testing

### Local Network Testing

```bash
# Start local Hardhat node with FHEVM support
npx hardhat node

# In another terminal, run tests
npm run test
```

Tests verify:
- Initialization state
- Diary creation with encrypted text
- Multiple diary entries per user
- User isolation (separate diaries per user)
- Decryption functionality

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
   - Text area for writing diary entries
   - Encrypts and submits to contract
   - Shows transaction status

2. **DiaryList**: 
   - Displays list of diary entries
   - Decrypt button to view decrypted content
   - Refresh button to reload latest entries

### Workflow

1. **Connect Wallet**: Click Rainbow wallet button in top right
2. **Write Diary**: 
   - Enter your travel diary text (max 512 characters)
   - Click "Create Encrypted Diary"
   - Wait for transaction confirmation
3. **View Diaries**: List of encrypted diary entries is displayed
4. **Decrypt Diary**: 
   - Click "Decrypt" button on a diary entry
   - Sign EIP712 message with wallet
   - View decrypted content

## Technical Details

### FHEVM Integration

- **SDK Loading**: Dynamically loads FHEVM Relayer SDK from CDN
- **Instance Creation**: Creates FHEVM instance based on network (mock for local, relayer for Sepolia)
- **Public Key Storage**: Uses IndexedDB to cache public keys and parameters
- **Decryption Signatures**: Uses in-memory storage for EIP712 signatures

### Security Features

1. **Input Proof Verification**: All encrypted inputs include cryptographic proofs verified by the contract
2. **Access Control**: Only authorized parties (contract and user) can decrypt encrypted values
3. **Privacy Preservation**: Actual diary text is never revealed on-chain
4. **EIP712 Signatures**: Decryption requests require cryptographic signatures to prevent unauthorized access

### Network Support

- **Localhost (31337)**: For development and testing with mock FHEVM
- **Sepolia Testnet (11155111)**: For public testing with Zama FHE relayer
- **Mainnet**: Ready for production deployment (with proper configuration)

## License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using [Zama FHEVM](https://docs.zama.ai/fhevm)**
