import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract } from "ethers";
import { deployBNH, deployMultiVesting } from "../utils/deployContracts";

describe("MultiVesting Upgradeability", function () {
    let multiVesting: Contract;
    let multiVestingV2: Contract;
    let bnhToken: Contract;
    let owner: SignerWithAddress;
    let beneficiary: SignerWithAddress;
    let otherAccount: SignerWithAddress;

    // Test parameters
    const BENEFICIARY_UPDATE_DELAY = 3600;
    const BENEFICIARY_UPDATE_VALIDITY = 300;
    const VESTING_AMOUNT = ethers.utils.parseEther("1000");
    const START_TIME_OFFSET = 100; // Start 100 seconds in the future
    const DURATION = 3600; // 1 hour duration
    const CLIFF = 600; // 10 minutes cliff

    before(async function () {
        [owner, beneficiary, otherAccount] = await ethers.getSigners();

        // 1. Deploy BNH Token
        bnhToken = await deployBNH();

        // 2. Deploy MultiVesting V1
        multiVesting = await deployMultiVesting(
            bnhToken.address,
            true, // beneficiaryUpdateEnabled
            true, // emergencyWithdrawEnabled
            BENEFICIARY_UPDATE_DELAY,
            BENEFICIARY_UPDATE_VALIDITY
        );

        // Transfer tokens to MultiVesting for vesting
        // Impersonate Gnosis wallet to mint tokens
        const gnosisAddress = await bnhToken.GNOSIS_WALLET();
        const gnosis = await ethers.getImpersonatedSigner(gnosisAddress);

        // Fund Gnosis wallet with ETH for gas
        await owner.sendTransaction({
            to: gnosisAddress,
            value: ethers.utils.parseEther("1.0"),
        });

        // Mint tokens directly to MultiVesting contract
        await bnhToken.connect(gnosis).mint(multiVesting.address, VESTING_AMOUNT.mul(10));
    });

    it("Should set manager and create a vesting schedule in V1", async function () {
        // MultiVesting transfers ownership to Gnosis on initialization
        const gnosisAddress = await multiVesting.GNOSIS_WALLET();
        const gnosis = await ethers.getImpersonatedSigner(gnosisAddress);

        // Fund Gnosis wallet
        await owner.sendTransaction({
            to: gnosisAddress,
            value: ethers.utils.parseEther("1.0"),
        });

        // Set manager to owner using Gnosis
        await multiVesting.connect(gnosis).setManager(owner.address);
        expect(await multiVesting.manager()).to.equal(owner.address);

        const startTime = (await ethers.provider.getBlock("latest")).timestamp + START_TIME_OFFSET;

        // Approve tokens for vesting (if needed by createVestingSchedule? No, it transfers from contract balance)
        // MultiVesting checks: vestingAmount + _amount > token.balanceOf(address(this))
        // We already transferred tokens to MultiVesting in 'before'.

        await multiVesting.connect(owner).createVestingSchedule(
            beneficiary.address,
            startTime,
            DURATION,
            VESTING_AMOUNT,
            CLIFF
        );

        const schedule = await multiVesting.beneficiary(beneficiary.address);
        expect(schedule.amount).to.equal(VESTING_AMOUNT);
        expect(schedule.cliff).to.equal(CLIFF);
    });

    it("Should upgrade to V2 and preserve state", async function () {
        const MultiVestingV2 = await ethers.getContractFactory("MultiVestingV2Mock");
        // Upgrade proxy
        // Note: Signer for upgrade should be proxy admin?
        // Hardhat upgrades plugin handles this if we use the same signer or if it finds the admin.
        // Usually, ProxyAdmin ownership is also transferred to Gnosis?
        // If ProxyAdmin owner is Gnosis, we need to use Gnosis to upgrade.

        // In this project, ProxyAdmin owner is usually 'adminContractAddress'.
        // deployProxy by default deploys a new ProxyAdmin owned by deployer.
        // Unless we transferred it?
        // The script documentation says "AdminContractAddress" is usually fixed.
        // But upgrades.deployProxy in testing usages typically keeps deployer as admin owner.

        multiVestingV2 = await upgrades.upgradeProxy(multiVesting.address, MultiVestingV2);
        await multiVestingV2.deployed();

        // Check if address is the same (proxy address)
        expect(multiVestingV2.address).to.equal(multiVesting.address);

        // Verify state preservation
        const schedule = await multiVestingV2.beneficiary(beneficiary.address);
        expect(schedule.amount).to.equal(VESTING_AMOUNT);
        expect(schedule.cliff).to.equal(CLIFF);

        // Verify manager is still owner
        expect(await multiVestingV2.manager()).to.equal(owner.address);
    });

    it("Should have new functionality in V2", async function () {
        // Check version function
        expect(await multiVestingV2.version()).to.equal("v2");

        // Check new variable
        await multiVestingV2.setNewVariable(123);
        expect(await multiVestingV2.newVariable()).to.equal(123);
    });

    it("Should still allow creating vesting schedules in V2", async function () {
        const startTime = (await ethers.provider.getBlock("latest")).timestamp + START_TIME_OFFSET;

        await multiVestingV2.createVestingSchedule(
            otherAccount.address,
            startTime,
            DURATION,
            VESTING_AMOUNT,
            CLIFF
        );

        const schedule = await multiVestingV2.beneficiary(otherAccount.address);
        expect(schedule.amount).to.equal(VESTING_AMOUNT);
    });
});
