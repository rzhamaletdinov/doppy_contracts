import { ethers, upgrades } from 'hardhat';
import { DOPPYConfig } from "../config/ContractsConfig";
import {DOPPYContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade DOPPY contract...');

  // We get the contract to deploy
  const NewDOPPYContract = await ethers.getContractFactory(DOPPYConfig.contractName);
  await upgrades.upgradeProxy(DOPPYConfig.proxyContractAddress, NewDOPPYContract) as DOPPYContractType;

  console.log('DOPPY Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
