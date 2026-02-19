import { ethers, upgrades } from "hardhat";
import {
  BNHContractType,
  DOPPYContractType,
  NFTContractType,
  BlockListContractType
} from "../lib/ContractProvider";
import {
  BlockListConfig,
  DOPPYConfig,
  BNHConfig,
  NFTCasesConfig,
  NFTGlassesConfig
} from "../config/ContractsConfig";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // console.log('Deploying blacklist contract...');
  //
  // // We get the contract to deploy
  // const CommonBlacklistContract = await ethers.getContractFactory(CommonBlacklistConfig.contractName);
  // const commonBlacklistProxy = await upgrades.deployProxy(CommonBlacklistContract, [], { initializer: 'initialize' }) as CommonBlacklistContractType;
  //
  // await commonBlacklistProxy.deployed();
  //
  // const commonBlacklistContract = await upgrades.erc1967.getImplementationAddress(commonBlacklistProxy.address);
  // const commonBlacklistAdmin = await upgrades.erc1967.getAdminAddress(commonBlacklistProxy.address);
  //
  // console.log('Contract blacklist deployed to:', commonBlacklistContract);
  // console.log('Proxy blacklist contract deployed to:', commonBlacklistProxy.address);
  // console.log('Admin blacklist contract deployed to:', commonBlacklistAdmin);

  console.log('Deploying DOPPY contract...');

  // We get the contract to deploy
  const DOPPYContract = await ethers.getContractFactory(DOPPYConfig.contractName);
  const doppyProxy = await upgrades.deployProxy(DOPPYContract, [], { initializer: 'initialize' }) as DOPPYContractType;

  await doppyProxy.deployed();

  const doppyContract = await upgrades.erc1967.getImplementationAddress(doppyProxy.address);
  const doppyAdmin = await upgrades.erc1967.getAdminAddress(doppyProxy.address);

  console.log('Contract DOPPY deployed to:', doppyContract);
  console.log('Proxy DOPPY contract deployed to:', doppyProxy.address);
  console.log('Admin DOPPY contract deployed to:', doppyAdmin);

  console.log('Deploying BNH contract...');

  // We get the contract to deploy
  const BNHContract = await ethers.getContractFactory(BNHConfig.contractName);
  const bnhProxy = await upgrades.deployProxy(BNHContract, [], { initializer: 'initialize' }) as BNHContractType;

  await bnhProxy.deployed();

  const bnhContract = await upgrades.erc1967.getImplementationAddress(bnhProxy.address);
  const bnhAdmin = await upgrades.erc1967.getAdminAddress(bnhProxy.address);

  console.log('Contract BNH deployed to:', bnhContract);
  console.log('Proxy BNH contract deployed to:', bnhProxy.address);
  console.log('Admin BNH contract deployed to:', bnhAdmin);

  console.log('Deploying NFT Glasses contract...');

  // We get the contract to deploy
  const NFTGlassesContract = await ethers.getContractFactory(NFTGlassesConfig.contractName);
  const nftGlassesProxy = await upgrades.deployProxy(NFTGlassesContract, [NFTGlassesConfig.nftName, NFTGlassesConfig.nftSymbol], { initializer: 'initialize' }) as NFTContractType;

  await nftGlassesProxy.deployed();

  const nftGlassesContract = await upgrades.erc1967.getImplementationAddress(nftGlassesProxy.address);
  const nftGlassesAdmin = await upgrades.erc1967.getAdminAddress(nftGlassesProxy.address);

  console.log('Contract NFT Glasses deployed to:', nftGlassesContract);
  console.log('Proxy NFT Glasses contract deployed to:', nftGlassesProxy.address);
  console.log('Admin NFT Glasses deployed to:', nftGlassesAdmin);

  console.log('Deploying NFT Cases contract...');

  // We get the contract to deploy
  const NFTCasesContract = await ethers.getContractFactory(NFTCasesConfig.contractName);
  const nftCasesProxy = await upgrades.deployProxy(NFTCasesContract, [NFTCasesConfig.nftName, NFTCasesConfig.nftSymbol], { initializer: 'initialize' }) as NFTContractType;

  await nftCasesProxy.deployed();

  const nftCasesContract = await upgrades.erc1967.getImplementationAddress(nftCasesProxy.address);
  const nftCasesdmin = await upgrades.erc1967.getAdminAddress(nftCasesProxy.address);

  console.log('Contract NFT Cases deployed to:', nftCasesContract);
  console.log('Proxy NFT Cases contract deployed to:', nftCasesProxy.address);
  console.log('Admin NFT Cases deployed to:', nftCasesdmin);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
