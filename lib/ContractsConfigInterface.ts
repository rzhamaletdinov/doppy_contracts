import NetworkConfigInterface from '../lib/NetworkConfigInterface';

export interface BlockListConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  multiSigAddress: string;
  contractAddress: string | null;
  proxyContractAddress: string;
  adminContractAddress: string | null;
}

export interface DOPPYConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  maxAmount: number;
  blockList: string;
  multiSigAddress: string;
  contractAddress: string | null;
  proxyContractAddress: string;
  adminContractAddress: string | null;
}

export interface BNHConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  tokenName: string;
  tokenSymbol: string;
  maxAmount: number;
  blockList: string;
  multiSigAddress: string;
  contractAddress: string | null;
  proxyContractAddress: string;
  adminContractAddress: string | null;
}

// export interface NFTConfigInterface {
//   testnet: NetworkConfigInterface;
//   mainnet: NetworkConfigInterface;
//   contractName: string;
//   nftName: string;
//   nftSymbol: string;
//   blockList: string;
//   multiSigAddress: string;
//   contractAddress: string | null;
//   proxyContractAddress: string;
//   adminContractAddress: string | null;
// }

// export interface NFTSaleConfigInterface {
//   testnet: NetworkConfigInterface;
//   mainnet: NetworkConfigInterface;
//   contractName: string;
//   multiSigAddress: string;
//   contractAddress: string | null;
//   proxyContractAddress: string;
//   adminContractAddress: string | null;
// }

export interface TreasuryConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  multiSigAddress: string;
  contractAddress: string | null;
  proxyContractAddress: string;
  adminContractAddress: string | null;
}

export interface MultiVestingConfigInterface {
  testnet: NetworkConfigInterface;
  mainnet: NetworkConfigInterface;
  contractName: string;
  contractAddress: string | null;
  proxyContractAddress: string;
  adminContractAddress: string | null;
  beneficiaryUpdateEnabled: boolean;
  emergencyWithdrawEnabled: boolean;
  beneficiaryUpdateDelaySeconds: number;
  beneficiaryUpdateValiditySeconds: number;
  bnhTokenAddress: string;
}


