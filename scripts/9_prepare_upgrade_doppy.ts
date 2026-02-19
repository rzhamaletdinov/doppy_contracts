import { ethers, upgrades } from 'hardhat';
import { DOPPYConfig } from "../config/ContractsConfig";
import {verify} from "./19_verify";

async function main() {
  console.log('Preparing for upgrade DOPPY contract...');

  // We get the contract to deploy
  const NewDOPPYContract = await ethers.getContractFactory(DOPPYConfig.contractName);
  const newDOPPYContract = await upgrades.prepareUpgrade(DOPPYConfig.proxyContractAddress, NewDOPPYContract) as string;

  console.log('New DOPPY Contract deployed to:', newDOPPYContract);
  console.log('Verification for DOPPY contract...');
  await verify(newDOPPYContract, []);
  console.log('DOPPY contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
