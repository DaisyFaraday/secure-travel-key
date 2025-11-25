// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title TravelDiary - Encrypted Travel Journal
/// @notice Allows users to store encrypted travel diary entries on-chain
/// @dev Uses FHE to store encrypted diary text as encoded numbers
contract TravelDiary is SepoliaConfig {
    // Diary entry structure
    struct DiaryEntry {
        uint256 timestamp;
        bytes32 encryptedTextHash; // Hash of the encrypted text for reference
        bool exists;
    }

    // Mapping from user address to their diary entries (diaryId => DiaryEntry)
    mapping(address => mapping(uint256 => DiaryEntry)) private _diaries;
    
    // Mapping from user address to their diary count
    mapping(address => uint256) private _diaryCounts;
    
    // Mapping from user address to encrypted text chunks (diaryId => chunkIndex => encryptedChunk)
    // Each text is encoded as multiple euint32 chunks
    mapping(address => mapping(uint256 => mapping(uint256 => euint32))) private _encryptedTextChunks;
    
    // Mapping to track chunk count per diary
    mapping(address => mapping(uint256 => uint256)) private _chunkCounts;

    event DiaryCreated(address indexed user, uint256 indexed diaryId, uint256 timestamp);
    event DiaryDecrypted(address indexed user, uint256 indexed diaryId);

    /// @notice Create a new encrypted diary entry
    /// @param encryptedTextChunks Array of encrypted text chunks (each chunk is a euint32)
    /// @param inputProofs Array of input proofs for each chunk
    /// @dev Text is encoded as multiple euint32 values, each encrypted separately
    function createDiary(
        externalEuint32[] calldata encryptedTextChunks,
        bytes[] calldata inputProofs
    ) external {
        require(encryptedTextChunks.length > 0, "Diary cannot be empty");
        require(encryptedTextChunks.length == inputProofs.length, "Mismatched arrays");
        require(encryptedTextChunks.length <= 128, "Diary too long"); // Max 128 chunks = ~512 characters

        uint256 diaryId = _diaryCounts[msg.sender];
        
        // Store encrypted chunks
        for (uint256 i = 0; i < encryptedTextChunks.length; i++) {
            euint32 encryptedChunk = FHE.fromExternal(encryptedTextChunks[i], inputProofs[i]);
            _encryptedTextChunks[msg.sender][diaryId][i] = encryptedChunk;
            
            // Grant decryption permissions
            FHE.allowThis(encryptedChunk);
            FHE.allow(encryptedChunk, msg.sender);
        }
        
        _chunkCounts[msg.sender][diaryId] = encryptedTextChunks.length;
        
        // Create diary entry
        bytes32 textHash = keccak256(abi.encodePacked(encryptedTextChunks));
        _diaries[msg.sender][diaryId] = DiaryEntry({
            timestamp: block.timestamp,
            encryptedTextHash: textHash,
            exists: true
        });
        
        _diaryCounts[msg.sender]++;
        
        emit DiaryCreated(msg.sender, diaryId, block.timestamp);
    }

    /// @notice Get the number of diaries for a user
    /// @param user The user address
    /// @return count The number of diaries
    function getDiaryCount(address user) external view returns (uint256 count) {
        return _diaryCounts[user];
    }

    /// @notice Get diary entry metadata
    /// @param user The user address
    /// @param diaryId The diary ID
    /// @return timestamp The timestamp when the diary was created
    /// @return exists Whether the diary exists
    function getDiaryEntry(address user, uint256 diaryId) external view returns (uint256 timestamp, bool exists) {
        DiaryEntry memory entry = _diaries[user][diaryId];
        return (entry.timestamp, entry.exists);
    }

    /// @notice Get encrypted text chunk for a diary
    /// @param user The user address
    /// @param diaryId The diary ID
    /// @param chunkIndex The chunk index
    /// @return encryptedChunk The encrypted chunk
    function getEncryptedTextChunk(
        address user,
        uint256 diaryId,
        uint256 chunkIndex
    ) external view returns (euint32 encryptedChunk) {
        return _encryptedTextChunks[user][diaryId][chunkIndex];
    }

    /// @notice Get the number of chunks for a diary
    /// @param user The user address
    /// @param diaryId The diary ID
    /// @return chunkCount The number of chunks
    function getChunkCount(address user, uint256 diaryId) external view returns (uint256 chunkCount) {
        return _chunkCounts[user][diaryId];
    }
}

