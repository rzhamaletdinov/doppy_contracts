import { ethers, upgrades } from 'hardhat';
import { BNHConfig } from "../config/ContractsConfig";
import { verify } from "./19_verify";

async function main() {
  console.log('Preparing for upgrade BNH contract...');

  // We get the contract to deploy
  const NewBNHContract = await ethers.getContractFactory(BNHConfig.contractName);
  const newBNHContract = await upgrades.prepareUpgrade(BNHConfig.proxyContractAddress, NewBNHContract) as string;

  console.log('New BNH Contract deployed to:', newBNHContract);
  console.log('Verification for BNH contract...');
  await verify(newBNHContract, []);
  console.log('BNH contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
