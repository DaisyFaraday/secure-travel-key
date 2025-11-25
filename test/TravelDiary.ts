import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { TravelDiary, TravelDiary__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("TravelDiary")) as TravelDiary__factory;
  const travelDiaryContract = (await factory.deploy()) as TravelDiary;
  const travelDiaryContractAddress = await travelDiaryContract.getAddress();

  return { travelDiaryContract, travelDiaryContractAddress };
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

describe("TravelDiary", function () {
  let signers: Signers;
  let travelDiaryContract: TravelDiary;
  let travelDiaryContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ travelDiaryContract, travelDiaryContractAddress } = await deployFixture());
  });

  it("should have zero diaries after deployment", async function () {
    const diaryCount = await travelDiaryContract.getDiaryCount(signers.alice.address);
    expect(diaryCount).to.eq(0);
  });

  it("should create a diary entry with encrypted text", async function () {
    const diaryText = "Today I visited Paris. It was amazing!";
    const uint32Array = encodeTextToUint32Array(diaryText);
    
    // Encrypt each chunk
    const encryptedChunks = [];
    const inputProofs = [];
    
    for (const value of uint32Array) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      
      encryptedChunks.push(encryptedInput.handles[0]);
      inputProofs.push(encryptedInput.inputProof);
    }

    const tx = await travelDiaryContract
      .connect(signers.alice)
      .createDiary(encryptedChunks, inputProofs);
    await tx.wait();

    const diaryCount = await travelDiaryContract.getDiaryCount(signers.alice.address);
    expect(diaryCount).to.eq(1);

    const [timestamp, exists] = await travelDiaryContract.getDiaryEntry(signers.alice.address, 0);
    expect(exists).to.be.true;
    expect(timestamp).to.be.gt(0);

    const chunkCount = await travelDiaryContract.getChunkCount(signers.alice.address, 0);
    expect(chunkCount).to.eq(uint32Array.length);
  });

  it("should allow user to decrypt their own diary", async function () {
    const diaryText = "Beautiful sunset in Tokyo!";
    const uint32Array = encodeTextToUint32Array(diaryText);
    
    // Encrypt and create diary
    const encryptedChunks = [];
    const inputProofs = [];
    
    for (const value of uint32Array) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      
      encryptedChunks.push(encryptedInput.handles[0]);
      inputProofs.push(encryptedInput.inputProof);
    }

    const tx = await travelDiaryContract
      .connect(signers.alice)
      .createDiary(encryptedChunks, inputProofs);
    await tx.wait();

    // Wait for permissions to be set
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Decrypt each chunk
    const chunkCount = await travelDiaryContract.getChunkCount(signers.alice.address, 0);
    const decryptedValues: number[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      const encryptedChunk = await travelDiaryContract.getEncryptedTextChunk(
        signers.alice.address,
        0,
        i
      );
      
      const decryptedValue = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedChunk,
        travelDiaryContractAddress,
        signers.alice
      );
      
      decryptedValues.push(Number(decryptedValue));
    }

    const decryptedText = decodeUint32ArrayToText(decryptedValues);
    expect(decryptedText).to.eq(diaryText);
  });

  it("should allow multiple diary entries per user", async function () {
    const diaryText1 = "First day in Rome";
    const diaryText2 = "Second day exploring";

    // Create first diary
    const uint32Array1 = encodeTextToUint32Array(diaryText1);
    const encryptedChunks1 = [];
    const inputProofs1 = [];
    
    for (const value of uint32Array1) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      
      encryptedChunks1.push(encryptedInput.handles[0]);
      inputProofs1.push(encryptedInput.inputProof);
    }

    await (await travelDiaryContract
      .connect(signers.alice)
      .createDiary(encryptedChunks1, inputProofs1)).wait();

    // Create second diary
    const uint32Array2 = encodeTextToUint32Array(diaryText2);
    const encryptedChunks2 = [];
    const inputProofs2 = [];
    
    for (const value of uint32Array2) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      
      encryptedChunks2.push(encryptedInput.handles[0]);
      inputProofs2.push(encryptedInput.inputProof);
    }

    await (await travelDiaryContract
      .connect(signers.alice)
      .createDiary(encryptedChunks2, inputProofs2)).wait();

    const diaryCount = await travelDiaryContract.getDiaryCount(signers.alice.address);
    expect(diaryCount).to.eq(2);
  });

  it("should isolate diaries between different users", async function () {
    const aliceText = "Alice's secret diary";
    const bobText = "Bob's secret diary";

    // Alice creates diary
    const aliceUint32Array = encodeTextToUint32Array(aliceText);
    const aliceEncryptedChunks = [];
    const aliceInputProofs = [];
    
    for (const value of aliceUint32Array) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(value)
        .encrypt();
      
      aliceEncryptedChunks.push(encryptedInput.handles[0]);
      aliceInputProofs.push(encryptedInput.inputProof);
    }

    await (await travelDiaryContract
      .connect(signers.alice)
      .createDiary(aliceEncryptedChunks, aliceInputProofs)).wait();

    // Bob creates diary
    const bobUint32Array = encodeTextToUint32Array(bobText);
    const bobEncryptedChunks = [];
    const bobInputProofs = [];
    
    for (const value of bobUint32Array) {
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.bob.address)
        .add32(value)
        .encrypt();
      
      bobEncryptedChunks.push(encryptedInput.handles[0]);
      bobInputProofs.push(encryptedInput.inputProof);
    }

    await (await travelDiaryContract
      .connect(signers.bob)
      .createDiary(bobEncryptedChunks, bobInputProofs)).wait();

    const aliceCount = await travelDiaryContract.getDiaryCount(signers.alice.address);
    const bobCount = await travelDiaryContract.getDiaryCount(signers.bob.address);
    
    expect(aliceCount).to.eq(1);
    expect(bobCount).to.eq(1);
  });
});

