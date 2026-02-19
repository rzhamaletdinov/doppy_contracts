import { ethers, upgrades } from 'hardhat';
import { BNHConfig } from "../config/ContractsConfig";
import { BNHContractType } from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade BNH contract...');

  // We get the contract to deploy
  const NewBNHContract = await ethers.getContractFactory(BNHConfig.contractName);
  await upgrades.upgradeProxy(BNHConfig.proxyContractAddress, NewBNHContract) as BNHContractType;

  console.log('BNH Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
