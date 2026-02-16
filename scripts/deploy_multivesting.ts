import { ethers, upgrades } from "hardhat";
import { verify } from "./19_verify";
import { MultiVestingConfig, CHEELConfig } from "../config/ContractsConfig";
import { MultiVestingContractType } from "../lib/ContractProvider";

async function main() {
    console.log('Deploying MultiVesting contract...');

    const MV = await ethers.getContractFactory(MultiVestingConfig.contractName);

    // Use configured CHEEL address if available, otherwise fallback to CHEELConfig proxy address
    const cheelAddress = MultiVestingConfig.cheelTokenAddress || CHEELConfig.proxyContractAddress;

    const multiVesting = await upgrades.deployProxy(MV, [
        cheelAddress,
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
