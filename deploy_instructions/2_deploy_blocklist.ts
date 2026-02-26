import { ethers, upgrades } from 'hardhat';
import { BlockListConfig } from "../config/ContractsConfigProd";
import { verify } from "../scripts/19_verify";

async function main() {
  console.log('Deploying BlockList contract...');

  const BlockListContract = await ethers.getContractFactory(BlockListConfig.contractName);
  const blockListProxy = await upgrades.deployProxy(BlockListContract, [], { initializer: 'initialize' });

  await blockListProxy.deployed();

  const blockListImpl = await upgrades.erc1967.getImplementationAddress(blockListProxy.address);
  const blockListAdmin = await upgrades.erc1967.getAdminAddress(blockListProxy.address);

  console.log('BlockList implementation deployed to:', blockListImpl);
  console.log('BlockList proxy deployed to:', blockListProxy.address);
  console.log('BlockList admin deployed to:', blockListAdmin);

  console.log('Verification for BlockList contract...');
  await verify(blockListImpl, []);
  console.log('BlockList contract is verified');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
