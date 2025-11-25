import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { TravelDiary } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("TravelDiarySepolia", function () {
  let signers: Signers;
  let travelDiaryContract: TravelDiary;
  let travelDiaryContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  // Helper function to encode text to uint32 array
  function encodeTextToUint32Array(text: string): number[] {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    const uint32Array: number[] = [];
    
    for (let i = 0; i < bytes.length; i += 4) {
      let value = 0;
      for (let j = 0; j < 4 && i + j < bytes.length; j++) {
        value |= bytes[i + j] << (j * 8);
      }
      uint32Array.push(value);
    }
    
    return uint32Array;
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const TravelDiaryDeployment = await deployments.get("TravelDiary");
      travelDiaryContractAddress = TravelDiaryDeployment.address;
      travelDiaryContract = await ethers.getContractAt("TravelDiary", TravelDiaryDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should create and decrypt a diary entry", async function () {
    steps = 15;

    this.timeout(4 * 40000);

    const diaryText = "Today I visited Paris. It was amazing!";
    progress(`Encoding text: "${diaryText}"`);
    const uint32Array = encodeTextToUint32Array(diaryText);
    progress(`Encoded to ${uint32Array.length} chunks`);

    progress("Encrypting chunks...");
    const encryptedChunks = [];
    const inputProofs = [];
    
    for (let i = 0; i < uint32Array.length; i++) {
      progress(`Encrypting chunk ${i + 1}/${uint32Array.length}...`);
      const encryptedInput = await fhevm
        .createEncryptedInput(travelDiaryContractAddress, signers.alice.address)
        .add32(uint32Array[i])
        .encrypt();
      
      encryptedChunks.push(encryptedInput.handles[0]);
      inputProofs.push(encryptedInput.inputProof);
    }

    progress(`Creating diary with ${encryptedChunks.length} chunks...`);
    const tx = await travelDiaryContract
      .connect(signers.alice)
      .createDiary(encryptedChunks, inputProofs);
    await tx.wait();
    progress("Diary created successfully");

    progress("Waiting for permissions to be set...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    progress("Fetching diary count...");
    const diaryCount = await travelDiaryContract.getDiaryCount(signers.alice.address);
    expect(diaryCount).to.eq(1);

    progress("Fetching chunk count...");
    const chunkCount = await travelDiaryContract.getChunkCount(signers.alice.address, 0);
    expect(chunkCount).to.eq(uint32Array.length);

    progress("Decrypting chunks...");
    const decryptedValues: number[] = [];
    
    for (let i = 0; i < chunkCount; i++) {
      progress(`Decrypting chunk ${i + 1}/${chunkCount}...`);
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

    progress("Decoding decrypted values...");
    // Helper function to decode uint32 array to text
    function decodeUint32ArrayToText(uint32Array: number[]): string {
      const bytes: number[] = [];
      
      for (const value of uint32Array) {
        for (let j = 0; j < 4; j++) {
          const byte = (value >> (j * 8)) & 0xff;
          if (byte !== 0) {
            bytes.push(byte);
          }
        }
      }
      
      while (bytes.length > 0 && bytes[bytes.length - 1] === 0) {
        bytes.pop();
      }
      
      const decoder = new TextDecoder();
      return decoder.decode(new Uint8Array(bytes));
    }

    const decryptedText = decodeUint32ArrayToText(decryptedValues);
    progress(`Decrypted text: "${decryptedText}"`);
    expect(decryptedText).to.eq(diaryText);
  });
});

