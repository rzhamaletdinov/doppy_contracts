import {
  CHEELConfigInterface,
  BlockListConfigInterface, LEEConfigInterface, NFTConfigInterface, NFTSaleConfigInterface, TreasuryConfigInterface, MultiVestingConfigInterface
} from '../lib/ContractsConfigInterface';
import * as Networks from '../lib/Networks';

export const BlockListConfig: BlockListConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'BlockList',
  multiSigAddress: '',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
};

export const LEEConfig: LEEConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'LEE',
  tokenName: 'CHEELEE Attention Token',
  tokenSymbol: 'LEE',
  maxAmount: 30000000000,
  blockList: '',
  multiSigAddress: '',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
};

export const CHEELConfig: CHEELConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'CHEEL',
  tokenName: 'CHEELEE',
  tokenSymbol: 'CHEEL',
  maxAmount: 1000000000,
  blockList: '',
  multiSigAddress: '',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
};

// export const NFTGlassesConfig: NFTConfigInterface = {
//   testnet: Networks.bscTestnet,
//   mainnet: Networks.bscMainnet,
//   contractName: 'NFT',
//   nftName: 'CHEELEE NFT Glasses',
//   nftSymbol: 'CNFTG',
//   blockList: '',
//   multiSigAddress: '',
//   contractAddress: '',
//   proxyContractAddress: '',
//   adminContractAddress: '',
// };

// export const NFTCasesConfig: NFTConfigInterface = {
//   testnet: Networks.bscTestnet,
//   mainnet: Networks.bscMainnet,
//   contractName: 'NFT',
//   nftName: 'CHEELEE NFT Cases',
//   nftSymbol: 'CNFTC',
//   blockList: '',
//   multiSigAddress: '',
//   contractAddress: '',
//   proxyContractAddress: '',
//   adminContractAddress: '',
// };

// export const NFTSaleConfig: NFTSaleConfigInterface = {
//   testnet: Networks.bscTestnet,
//   mainnet: Networks.bscMainnet,
//   contractName: 'NFTSale',
//   multiSigAddress: '',
//   contractAddress: '',
//   proxyContractAddress: '',
//   adminContractAddress: '',
// };

export const TreasuryConfig: TreasuryConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'Treasury',
  multiSigAddress: '',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
};

export const MultiVestingConfig: MultiVestingConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'MultiVesting',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
  beneficiaryUpdateEnabled: true,
  emergencyWithdrawEnabled: true,
  beneficiaryUpdateDelaySeconds: 3600,
  beneficiaryUpdateValiditySeconds: 300,
  cheelTokenAddress: '',
};

