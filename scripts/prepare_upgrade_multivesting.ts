import { ethers, upgrades } from 'hardhat';
import { MultiVestingConfig } from "../config/ContractsConfig";
import { verify } from "./19_verify";

async function main() {
    console.log('Preparing for upgrade MultiVesting contract...');

    // We get the contract to deploy
    const NewMultiVestingContract = await ethers.getContractFactory(MultiVestingConfig.contractName);
    const newMultiVestingContract = await upgrades.prepareUpgrade(MultiVestingConfig.proxyContractAddress, NewMultiVestingContract) as string;

    console.log('New MultiVesting Contract deployed to:', newMultiVestingContract);
    console.log('Verification for MultiVesting contract...');
    await verify(newMultiVestingContract, []);
    console.log('MultiVesting contract is verified');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
