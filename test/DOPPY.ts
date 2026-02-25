import { expect } from "chai";
import {
  expectRevert,
  constants
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { DOPPYConfig, BlockListConfig } from '../config/ContractsConfig';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { deployBlockList, deployDOPPY } from "../utils/deployContracts";
import { expectCustomError } from "../utils/helpers";

describe(DOPPYConfig.contractName, () => {
  let blockList: Contract;
  let doppy: Contract;
  let gnosis: SignerWithAddress;
  let blockListGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let verybadguy: SignerWithAddress;
  let BLOCKLIST_ADMIN_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy BlockList
    blockList = await deployBlockList();

    // Deploy DOPPY
    doppy = await deployDOPPY();

    // Creating GNOSIS
    [etherHolder, deployer, receiver, badguy, moderator, verybadguy] = await ethers.getSigners();
    gnosis = await ethers.getImpersonatedSigner(DOPPYConfig.multiSigAddress);
    blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress);
    await etherHolder.sendTransaction({
      to: DOPPYConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    });
    await etherHolder.sendTransaction({
      to: BlockListConfig.multiSigAddress,
      value: ethers.utils.parseEther("1")
    });

    BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
  });

  describe("Normal cases:", async () => {
    it("Setting blockList", async function () {
      await doppy.connect(gnosis).setBlockList(blockList.address);
    });

    it("Check initial data", async function () {
      expect(await doppy.name()).to.equal(DOPPYConfig.tokenName);
      expect(await doppy.symbol()).to.equal(DOPPYConfig.tokenSymbol);
      const maxAmount = parseEther(`${DOPPYConfig.maxAmount}`).toString();
      expect((await doppy.MAX_SUPPLY()).toString()).to.equal(maxAmount);
      expect((await doppy.totalSupply()).toString()).to.equal('0');
      expect((await doppy.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());
      expect((await doppy.GNOSIS_WALLET()).toUpperCase()).to.equal(DOPPYConfig.multiSigAddress.toUpperCase());
      expect((await doppy.owner()).toUpperCase()).to.equal(DOPPYConfig.multiSigAddress.toUpperCase());
    });

    it("Mint and approve all contracts", async function () {

      await doppy.connect(gnosis).mint(
        gnosis.address,
        parseEther("1000000")
      );

      await doppy.connect(gnosis).mint(
        deployer.address,
        parseEther("1000000")
      );

      await doppy.connect(gnosis).mint(
        receiver.address,
        parseEther("2000000")
      );

      await doppy.connect(gnosis).mint(
        badguy.address,
        parseEther("3000000")
      );

      await doppy.connect(gnosis).mint(
        verybadguy.address,
        parseEther("3000000")
      );

      expect(await doppy.totalSupply()).to.equal(parseEther("10000000"));

      expect(await doppy.balanceOf(gnosis.address)).to.equal(parseEther("1000000"));

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await doppy.balanceOf(receiver.address)).to.equal(parseEther("2000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("3000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("3000000"));
    });

    it("Burn tokens", async function () {
      await doppy.connect(gnosis).burn(
        parseEther("1000000")
      );

      expect(await doppy.balanceOf(gnosis.address)).to.equal(parseEther("0"));

      expect(await doppy.totalSupply()).to.equal(parseEther("9000000"));
    });

    it("Transactions", async function () {
      await doppy.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("2000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("2000000"));
    });
  });

  describe("Global Blocklist", async () => {
    it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
      result = await blockList.connect(blockListGnosis).grantRole(
        BLOCKLIST_ADMIN_ROLE,
        moderator.address
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.role).to.equal(BLOCKLIST_ADMIN_ROLE);
      expect(resultWaited.events[0].args.account).to.equal(moderator.address);
      expect(await blockList.hasRole(BLOCKLIST_ADMIN_ROLE, moderator.address)).to.be.true;
    });

    it("Adding verybadguy for common blocklist", async function () {
      await blockList.connect(moderator).addUsersToBlockList(
        [verybadguy.address]
      );

      expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
      expect(await blockList.userIsBlocked(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

    it("Blocking transactions for users in common blocklist", async function () {
      await expectCustomError(
        doppy.connect(verybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "BlockedByGlobalBlockList"
      );

      await expectRevert(
        doppy.connect(gnosis).transferFrom(
          verybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("2000000"));

      expect(await doppy.balanceOf(verybadguy.address)).to.equal(parseEther("3000000"));
    });

    it("Removing verybadguy from common blocklist", async function () {
      await blockList.connect(moderator).removeUsersFromBlockList(
        [verybadguy.address]
      );

      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

    it("UnBlocking transactions for users in common blocklist and blocking again", async function () {
      result = await doppy.connect(verybadguy).transfer(
        deployer.address,
        parseEther("1000000")
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(verybadguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        doppy.connect(gnosis).transferFrom(
          verybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("3000000"));

      expect(await doppy.balanceOf(verybadguy.address)).to.equal(parseEther("2000000"));

      await blockList.connect(moderator).addUsersToBlockList(
        [verybadguy.address]
      );
    });
  });

  describe("Internal Blocklist", async () => {
    it("Adding badguy for internal blocklist", async function () {
      await blockList.connect(moderator).addUsersToInternalBlockList(
        doppy.address,
        [badguy.address]
      );

      expect(await blockList.userIsInternalBlocked(doppy.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
      expect(await blockList.userIsInternalBlocked(doppy.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsInternalBlocked(doppy.address, verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
    });

    it("Blocking transactions for users in internal blocklist", async function () {

      await expectCustomError(
        doppy.connect(badguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "BlockedByInternalBlockList"
      );

      await expectCustomError(
        doppy.connect(deployer).transfer(
          badguy.address,
          parseEther("1000000")
        ),
        "BlockedByInternalBlockList"
      );

      await expectRevert(
        doppy.connect(badguy).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        doppy.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("3000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("2000000"));
    });

    it("Removing badguy from internal blocklist", async function () {
      await blockList.connect(moderator).removeUsersFromInternalBlockList(
        doppy.address,
        [badguy.address]
      );

      expect(await blockList.userIsInternalBlocked(doppy.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

    it("UnBlocking transactions for users in internal blocklist and blocking again", async function () {
      result = await doppy.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(badguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        doppy.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("4000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("1000000"));

      await blockList.connect(moderator).addUsersToInternalBlockList(
        doppy.address,
        [badguy.address]
      );
    });
  });

  describe("Getting information about the presence of users from the list in the blocklist", async () => {
    it("Only internal blocklisted user", async function () {
      result = await blockList.connect(moderator).usersFromListIsBlocked(
        doppy.address,
        [deployer.address, receiver.address, badguy.address]
      );

      expect(result.toString()).to.equal(
        [badguy.address].toString()
      );
    });

    it("Internal and global blocklisted user", async function () {
      result = await blockList.connect(moderator).usersFromListIsBlocked(
        doppy.address,
        [deployer.address, receiver.address, badguy.address, verybadguy.address]
      );

      expect(result.toString()).to.equal(
        [badguy.address, verybadguy.address].toString()
      );
    });

    it("internal user is global blocklisted", async function () {
      result = await blockList.connect(moderator).usersFromListIsBlocked(
        constants.ZERO_ADDRESS,
        [deployer.address, receiver.address, badguy.address, verybadguy.address]
      );

      expect(result.toString()).to.equal(
        [verybadguy.address].toString()
      );
    });
  });

  describe("Token Rate Limit", async () => {
    before(async () => {
      // Advance time to the middle of the next month to avoid month boundary rollovers
      const latestBlock = await ethers.provider.getBlock("latest");
      const date = new Date(latestBlock.timestamp * 1000);
      date.setUTCMonth(date.getUTCMonth() + 1);
      date.setUTCDate(15);
      await ethers.provider.send("evm_setNextBlockTimestamp", [Math.floor(date.getTime() / 1000)]);
      await ethers.provider.send("evm_mine", []);
    });

    it("Adding Token limit", async function () {
      result = await blockList.connect(moderator).setTokenLimits(
        doppy.address,
        parseEther("1000000"),
        parseEther("1500000"),
        parseEther("1000000"),
        parseEther("1500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(doppy.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("1500000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("1500000").toString());

      result = await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        true,
        true,
        true,
        true
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(doppy.address);
      expect(resultWaited.events[0].args.hasDailyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasDailyOutcomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyOutcomeLimit).to.equal(true);

      {
        const _r = await blockList.getTokenLimits(doppy.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }
    });

    it("Testing Day and Month limits", async function () {

      // First transaction
      result = await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("500000"));
      }

      // Second transaction
      result = await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyOutcomeLimitReached"
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(parseEther("500000"));
      }

      // disable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        true,
        true,
        false,
        true
      );

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyIncomeLimitReached"
      );

      await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        false,
        true,
        false,
        true
      );

      await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("1")
      );

      // Compare limits
      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1000001"));
      }

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(parseEther("499999"));
      }

      // enable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        true,
        true,
        true,
        true
      );

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      // Next Day transaction
      result = await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("499999")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("499999").toString());

      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("499999"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("500001"));
        expect(_r[3]).to.equal(0);
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "MonthlyOutcomeLimitReached"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("2500000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
    });

    it("Increase limits", async function () {
      result = await blockList.connect(moderator).setTokenLimits(
        doppy.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("500000"),
        parseEther("3000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(doppy.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("3000000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("500000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("3000000").toString());

      {
        const _r = await blockList.getTokenLimits(doppy.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }
    });

    it("Testing Day and Month limits", async function () {
      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("1"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, receiver.address);
        expect(_r[0]).to.equal(parseEther("500001"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyOutcomeLimitReached"
      );

      await blockList.connect(moderator).setTokenLimits(
        doppy.address,
        parseEther("500000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("500000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("500001"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, receiver.address);
        expect(_r[0]).to.equal(parseEther("1"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyIncomeLimitReached"
      );

      await blockList.connect(moderator).setTokenLimits(
        doppy.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // First transaction
      result = await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("999999"));
        expect(_r[3]).to.equal(parseEther("2000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next Day transaction
      result = await doppy.connect(deployer).transfer(
        receiver.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );

      {
        const _r = await blockList.getUserTokenTransfers(doppy.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "DailyOutcomeLimitReached"
      );

      // disable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        false,
        true,
        false,
        true
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(0);
      }

      {
        const _r = await blockList.getUserRemainingLimit(doppy.address, receiver.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "MonthlyOutcomeLimitReached"
      );

      await blockList.connect(moderator).changeDisablingTokenLimits(
        doppy.address,
        false,
        true,
        false,
        false
      );

      await expectCustomError(
        doppy.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "MonthlyIncomeLimitReached"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await doppy.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
    });
  });

  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        doppy.connect(deployer).mint(
          receiver.address,
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await doppy.balanceOf(receiver.address)).to.equal(parseEther("5000000"));

      expect(await doppy.totalSupply()).to.equal(parseEther("9000000"));
    });

    it("Burn from users", async function () {
      await expectRevert(
        doppy.connect(deployer).burn(
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await doppy.totalSupply()).to.equal(parseEther("9000000"));
    });

    it("Minting over max amount from owner", async function () {
      await expectCustomError(
        doppy.connect(gnosis).mint(
          gnosis.address,
          parseEther("30000000001")
        ),
        "MaxSupplyExceeded"
      );

      expect(await doppy.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await doppy.totalSupply()).to.equal(parseEther("9000000"));
    });
  });
});
