import { ethers, upgrades } from 'hardhat';
import { BlockListConfig } from "../config/ContractsConfig";
import {verify} from "./19_verify";

async function main() {
  console.log('Preparing for upgrade Blacklist contract...');

  // We get the contract to deploy
  const NewBlocklistContract = await ethers.getContractFactory(BlockListConfig.contractName);
  const newBlocklistContract = await upgrades.prepareUpgrade(BlockListConfig.proxyContractAddress, NewBlocklistContract) as string;

  console.log('New Blocklist Contract deployed to:', newBlocklistContract);
  console.log('Verification for Blocklist contract...');
  await verify(newBlocklistContract, []);
  console.log('Blocklist contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
