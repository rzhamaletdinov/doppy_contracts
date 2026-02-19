import {
  BlockList as BlockListType,
  DOPPY as DOPPYType,
  BNH as BNHType,
  NFT as NFTType,
  Treasury as TreasuryType,
  MultiVesting as MultiVestingType,
} from '../typechain/index';

import { ethers } from 'hardhat';

export class BlockListContractProvider {
  public static async getContract(contractName: string, contractAddress: string): Promise<BlockListType> {
    // Check configuration
    if (null === contractAddress) {
      throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
    }

    if (await ethers.provider.getCode(contractAddress) === '0x') {
      throw '\x1b[31merror\x1b[0m ' + `Can't find a contract deployed to the target address: ${contractAddress}`;
    }

    return await ethers.getContractAt(contractName, contractAddress) as BlockListType;
  }
};

export type BlockListContractType = BlockListType;
export type DOPPYContractType = DOPPYType;
export type BNHContractType = BNHType;
export type NFTContractType = NFTType;
export type TreasuryContractType = TreasuryType;
export type MultiVestingContractType = MultiVestingType;
