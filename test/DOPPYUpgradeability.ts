import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { ethers, upgrades } from "hardhat";
import { DOPPYConfig, BlockListConfig } from "../config/ContractsConfig";
import { parseEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import { deployBlockList } from "../utils/deployContracts";
import { expect } from "chai";
import { expectCustomError } from "../utils/helpers";


describe(`OLD${DOPPYConfig.contractName} Upgrade`, () => {
  let oldDoppy: Contract;
  let doppy: Contract;
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
    // Deploy OLDDOPPY
    const OLDDOPPY = await ethers.getContractFactory("OLDDOPPY");
    oldDoppy = await upgrades.deployProxy(OLDDOPPY, [], { initializer: "initialize" });
    await oldDoppy.deployed();

    // Deploy BlockList
    blockList = await deployBlockList();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(DOPPYConfig.multiSigAddress)
    blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
    await etherHolder.sendTransaction({
      to: DOPPYConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })
    await etherHolder.sendTransaction({
      to: BlockListConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    })

    BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
  });

  it("Mint tokens", async function () {

    await oldDoppy.connect(gnosis).mint(
      deployer.address,
      parseEther("1000000")
    );

    await oldDoppy.connect(gnosis).mint(
      badguy.address,
      parseEther("1000000")
    );
  });

  it('Upgrade to new DOPPY version', async function () {
    const DOPPY = await ethers.getContractFactory(DOPPYConfig.contractName);

    doppy = await upgrades.upgradeProxy(oldDoppy.address, DOPPY)
  });

  it("Setting blockList", async function () {
    await doppy.connect(gnosis).setBlockList(blockList.address);
  });

  it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
    await blockList.connect(blockListGnosis).grantRole(
      BLOCKLIST_ADMIN_ROLE,
      moderator.address
    );
  });

  it("Adding badguy for blocklist", async function () {
    expect((await doppy.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());

    await blockList.connect(moderator).addUsersToBlockList(
      [badguy.address]
    );

    expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
  });


  it("New function added works", async function () {
    await expectCustomError(
      doppy.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      ),
      "BlockedByGlobalBlockList"
    );

    await expectRevert(
      doppy.connect(gnosis).transferFrom(
        badguy.address,
        deployer.address,
        parseEther("1000000")
      ),
      "ERC20: insufficient allowance"
    );

    expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });

  it("Balancies is correct", async function () {
    expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

    expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
  });
});
