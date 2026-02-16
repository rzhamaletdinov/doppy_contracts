import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { ethers, upgrades } from "hardhat";
import { LEEConfig, BlockListConfig } from "../config/ContractsConfig";
import { parseEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import { deployBlockList } from "../utils/deployContracts";
import { expect } from "chai";
import { expectCustomError } from "../utils/helpers";


describe(`OLD${LEEConfig.contractName} Upgrade`, () => {
  let oldLee: Contract;
  let lee: Contract;
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
    // Deploy OLDLEE
    const OLDLEE = await ethers.getContractFactory("OLDLEE");
    oldLee = await upgrades.deployProxy(OLDLEE, [], { initializer: "initialize" });
    await oldLee.deployed();

    // Deploy BlockList
    blockList = await deployBlockList();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress)
    blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: LEEConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: BlockListConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
  });

  it("Mint tokens", async function () {

    await oldLee.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldLee.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new CHEEL version', async function () {
    const LEE = await ethers.getContractFactory(LEEConfig.contractName);

    lee = await upgrades.upgradeProxy(oldLee.address, LEE)
  });

  it("Setting blockList", async function () {
    await lee.connect(gnosis).setBlockList(blockList.address);
  });

  it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
    await blockList.connect(blockListGnosis).grantRole(
      BLOCKLIST_ADMIN_ROLE,
      moderator.address
    );
  });

  it("Adding badguy for blocklist", async function () {
    expect((await lee.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());

    await blockList.connect(moderator).addUsersToBlockList(
      [badguy.address]
    );

    expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
  });


  it("New function added works", async function () {
    await expectCustomError(
      lee.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      ),
      "BlockedByGlobalBlockList"
    );

    await expectRevert(
      lee.connect(gnosis).transferFrom(
        badguy.address,
        deployer.address,
        parseEther("1000000")
      ),
      "ERC20: insufficient allowance"
    );

    expect(await lee.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await lee.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });

  it("Balancies is correct", async function () {
    expect(await lee.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await lee.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });
});
