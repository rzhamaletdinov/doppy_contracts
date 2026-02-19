import { ethers, upgrades } from 'hardhat';
import { DOPPYContractType } from '../lib/ContractProvider';
import { DOPPYConfig } from "../config/ContractsConfig";
import {verify} from "./19_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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

  console.log('Verification for DOPPY contract...');
  await verify(doppyContract, []);
  console.log('DOPPY contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
