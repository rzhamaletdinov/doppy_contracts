import {
  BNHConfigInterface,
  BlockListConfigInterface, DOPPYConfigInterface, TreasuryConfigInterface, MultiVestingConfigInterface
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

export const DOPPYConfig: DOPPYConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'DOPPY',
  tokenName: 'Dreams, Optimism, Playfulness & You',
  tokenSymbol: 'DOPPY',
  maxAmount: 30000000000,
  blockList: '',
  multiSigAddress: '',
  contractAddress: '',
  proxyContractAddress: '',
  adminContractAddress: '',
};

export const BNHConfig: BNHConfigInterface = {
  testnet: Networks.bscTestnet,
  mainnet: Networks.bscMainnet,
  contractName: 'BNH',
  tokenName: 'Beyond Normal Horizons',
  tokenSymbol: 'BNH',
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
//   nftName: 'NFT Glasses',
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
//   nftName: 'NFT Cases',
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
  emergencyWithdrawEnabled: false,
  beneficiaryUpdateDelaySeconds: 3600,
  beneficiaryUpdateValiditySeconds: 300,
  bnhTokenAddress: '',
};
