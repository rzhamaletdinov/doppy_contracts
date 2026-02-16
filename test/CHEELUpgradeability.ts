import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { ethers, upgrades } from "hardhat";
import { CHEELConfig, BlockListConfig } from "../config/ContractsConfig";
import { parseEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import { deployBlockList, deployCHEEL } from "../utils/deployContracts";
import { expectCustomError } from "../utils/helpers";
import { expect } from "chai";

describe(`OLD${CHEELConfig.contractName} Upgrade`, () => {
  let oldCheel: Contract;
  let cheel: Contract;
  let blockList: Contract;
  let gnosis: SignerWithAddress;
  let blockListGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let BLOCKLIST_ADMIN_ROLE: string;

  before(async () => {
    // Deploy OLDCHEEL
    const OLDCHEEL = await ethers.getContractFactory("OLDCHEEL");
    oldCheel = await upgrades.deployProxy(OLDCHEEL, [], { initializer: "initialize" });
    await oldCheel.deployed();

    // Deploy BlockList
    blockList = await deployBlockList();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
    blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: CHEELConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: BlockListConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
  });

  it("Mint tokens", async function () {

    await oldCheel.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldCheel.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new CHEEL version', async function () {
    const CHEEL = await ethers.getContractFactory(CHEELConfig.contractName);

    cheel = await upgrades.upgradeProxy(oldCheel.address, CHEEL)
  });

  it("Setting blockList", async function () {
    await cheel.connect(gnosis).setBlockList(blockList.address);
  });

  it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
    expect((await cheel.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());

    await blockList.connect(blockListGnosis).grantRole(
      BLOCKLIST_ADMIN_ROLE,
      moderator.address
    );
  });

  it("Adding badguy for blocklist", async function () {
    await blockList.connect(moderator).addUsersToBlockList(
      [badguy.address]
    );

    expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
  });

  it("New function added works", async function () {
    await expectCustomError(
      cheel.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      ),
      "BlockedByGlobalBlockList"
    );

    await expectRevert(
      cheel.connect(gnosis).transferFrom(
        badguy.address,
        deployer.address,
        parseEther("1000000")
      ),
      "ERC20: insufficient allowance"
    );
  });

  it("Balancies is correct", async function () {
    expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });
});
