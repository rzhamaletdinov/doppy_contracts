import { ethers, upgrades } from 'hardhat';
import { BNHContractType } from '../lib/ContractProvider';
import { BNHConfig } from "../config/ContractsConfig";
import { verify } from "./19_verify";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

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

  console.log('Verification for BNH contract...');
  await verify(bnhContract, []);
  console.log('BNH contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
