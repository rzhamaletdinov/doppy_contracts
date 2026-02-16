import { ethers, upgrades } from 'hardhat';
import {BlockListConfig} from "../config/ContractsConfig";
import {BlockListContractType} from "../lib/ContractProvider";

async function main() {
  console.log('Upgrade Blocklist contract...');

  // We get the contract to deploy
  const NewBlocklistContract = await ethers.getContractFactory(BlockListConfig.contractName);
  await upgrades.upgradeProxy(BlockListConfig.proxyContractAddress, NewBlocklistContract) as BlockListContractType;

  console.log('Blocklist Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
