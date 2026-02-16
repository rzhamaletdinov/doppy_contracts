import { ethers, upgrades } from 'hardhat';
import { MultiVestingConfig } from "../config/ContractsConfig";
import { MultiVestingContractType } from "../lib/ContractProvider";

async function main() {
    console.log('Upgrade MultiVesting contract...');

    // We get the contract to deploy
    const NewMultiVestingContract = await ethers.getContractFactory(MultiVestingConfig.contractName);
    await upgrades.upgradeProxy(MultiVestingConfig.proxyContractAddress, NewMultiVestingContract) as MultiVestingContractType;

    console.log('MultiVesting Contract is upgraded');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
