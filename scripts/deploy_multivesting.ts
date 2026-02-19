import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";
import { MultiVestingConfig, BNHConfig } from "../config/ContractsConfig";
import { MultiVestingContractType } from "../lib/ContractProvider";

async function main() {
    console.log('Deploying MultiVesting contract...');

    const MV = await ethers.getContractFactory(MultiVestingConfig.contractName);

    // Use configured BNH address if available, otherwise fallback to BNHConfig proxy address
    const bnhAddress = MultiVestingConfig.bnhTokenAddress || BNHConfig.proxyContractAddress;

    const multiVesting = await upgrades.deployProxy(MV, [
        bnhAddress,
        MultiVestingConfig.beneficiaryUpdateEnabled,
        MultiVestingConfig.emergencyWithdrawEnabled,
        MultiVestingConfig.beneficiaryUpdateDelaySeconds,
        MultiVestingConfig.beneficiaryUpdateValiditySeconds
    ], { initializer: "initialize" }) as MultiVestingContractType;

    await multiVesting.deployed();

    const implAddress = await upgrades.erc1967.getImplementationAddress(multiVesting.address);
    const adminAddress = await upgrades.erc1967.getAdminAddress(multiVesting.address);

    console.log("MultiVesting implementation deployed to:", implAddress);
    console.log("MultiVesting proxy deployed to:", multiVesting.address);
    console.log("MultiVesting admin deployed to:", adminAddress);

    console.log("Verification for MultiVesting contract...");
    await verify(implAddress, []);
    console.log("MultiVesting contract is verified");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
