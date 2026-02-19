import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { ethers, upgrades } from "hardhat";
import { BNHConfig, BlockListConfig } from "../config/ContractsConfig";
import { parseEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import { deployBlockList, deployBNH } from "../utils/deployContracts";
import { expectCustomError } from "../utils/helpers";
import { expect } from "chai";

describe(`OLD${BNHConfig.contractName} Upgrade`, () => {
  let oldBnh: Contract;
  let bnh: Contract;
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
    // Deploy OLDBNH
    const OLDBNH = await ethers.getContractFactory("OLDBNH");
    oldBnh = await upgrades.deployProxy(OLDBNH, [], { initializer: "initialize" });
    await oldBnh.deployed();

    // Deploy BlockList
    blockList = await deployBlockList();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(BNHConfig.multiSigAddress)
    blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: BNHConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: BlockListConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
  });

  it("Mint tokens", async function () {

    await oldBnh.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldBnh.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new BNH version', async function () {
    const BNH = await ethers.getContractFactory(BNHConfig.contractName);

    bnh = await upgrades.upgradeProxy(oldBnh.address, BNH)
  });

  it("Setting blockList", async function () {
    await bnh.connect(gnosis).setBlockList(blockList.address);
  });

  it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
    expect((await bnh.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());

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
      bnh.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      ),
      "BlockedByGlobalBlockList"
    );

    await expectRevert(
      bnh.connect(gnosis).transferFrom(
        badguy.address,
        deployer.address,
        parseEther("1000000")
      ),
      "ERC20: insufficient allowance"
    );
  });

  it("Balancies is correct", async function () {
    expect(await bnh.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await bnh.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });
});
