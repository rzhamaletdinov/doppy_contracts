import { expect } from "chai";
import {
  expectRevert,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { CHEELConfig, BlockListConfig } from '../config/ContractsConfig';
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployCHEEL, deployBlockList } from "../utils/deployContracts";
import { Contract } from "ethers";
import { expectCustomError } from "../utils/helpers";


describe(CHEELConfig.contractName, () => {
  let blockList: Contract;
  let cheel: Contract;
  let gnosis: SignerWithAddress;
  let blockListGnosis: SignerWithAddress;
  let etherHolder: SignerWithAddress;
  let deployer: SignerWithAddress;
  let receiver: SignerWithAddress;
  let badguy: SignerWithAddress;
  let moderator: SignerWithAddress;
  let verybadguy: SignerWithAddress;
  let clearLimitsUser: SignerWithAddress;
  let exclusionContract: SignerWithAddress;
  let BLOCKLIST_ADMIN_ROLE: string;
  let result: any;
  let resultWaited: any;

  before(async () => {
    // Deploy BlockList
    blockList = await deployBlockList();

    // Deploy CHEEL
    cheel = await deployCHEEL();

    // Create GENOSIS
    [etherHolder, deployer, receiver, badguy, moderator, verybadguy, clearLimitsUser, exclusionContract] = await ethers.getSigners();
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

  describe("Normal cases:", async () => {
    it("Setting blockList", async function () {
      await cheel.connect(gnosis).setBlockList(blockList.address);
    });

    it("Check initial data", async function () {
      expect(await cheel.name()).to.equal(CHEELConfig.tokenName);
      expect(await cheel.symbol()).to.equal(CHEELConfig.tokenSymbol);
      const maxAmount = parseEther(`${CHEELConfig.maxAmount}`).toString();
      expect((await cheel.MAX_SUPPLY()).toString()).to.equal(maxAmount);
      expect((await cheel.totalSupply()).toString()).to.equal('0');
      expect((await cheel.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());
      expect((await cheel.GNOSIS_WALLET()).toUpperCase()).to.equal(CHEELConfig.multiSigAddress.toUpperCase());
      expect((await cheel.owner()).toUpperCase()).to.equal(CHEELConfig.multiSigAddress.toUpperCase());
    });

    it("Mint and approve all contracts", async function () {

      await cheel.connect(gnosis).mint(
        gnosis.address,
        parseEther("1000000")
      );

      await cheel.connect(gnosis).mint(
        deployer.address,
        parseEther("1000000")
      );

      await cheel.connect(gnosis).mint(
        receiver.address,
        parseEther("2000000")
      );

      await cheel.connect(gnosis).mint(
        badguy.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        verybadguy.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        exclusionContract.address,
        parseEther("3000000")
      );

      await cheel.connect(gnosis).mint(
        clearLimitsUser.address,
        parseEther("3000000")
      );

      expect(await cheel.totalSupply()).to.equal(parseEther("16000000"));

      expect(await cheel.balanceOf(gnosis.address)).to.equal(parseEther("1000000"));

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await cheel.balanceOf(receiver.address)).to.equal(parseEther("2000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("3000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("3000000"));

      expect(await cheel.balanceOf(exclusionContract.address)).to.equal(parseEther("3000000"));

      expect(await cheel.balanceOf(clearLimitsUser.address)).to.equal(parseEther("3000000"));
    });

    it("Burn tokens", async function () {
      await cheel.connect(gnosis).burn(
        parseEther("1000000")
      );

      expect(await cheel.balanceOf(gnosis.address)).to.equal(parseEther("0"));

      expect(await cheel.totalSupply()).to.equal(parseEther("15000000"));
    });

    it("Transactions", async function () {
      await cheel.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("2000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("2000000"));
    });

    it("Delegate", async function () {
      await cheel.connect(badguy).delegate(
        deployer.address
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("2000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("2000000"));
    });
  });

  describe("Global blocklist", async () => {


    it("Adding verybadguy for global blocklist", async function () {
      await blockList.connect(blockListGnosis).addUsersToBlockList(
        [verybadguy.address]
      );

      expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
      expect(await blockList.userIsBlocked(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

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

    it("Blocking transactions for users in global blocklist", async function () {
      await expectCustomError(
        cheel.connect(verybadguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "BlockedByGlobalBlockList"
      );

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          verybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("2000000"));

      expect(await cheel.balanceOf(verybadguy.address)).to.equal(parseEther("3000000"));
    });

    it("Removing verybadguy from global blocklist", async function () {
      await blockList.connect(moderator).removeUsersFromBlockList(
        [verybadguy.address]
      );

      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

    it("UnBlocking transactions for users in global blocklist and blocking again", async function () {
      result = await cheel.connect(verybadguy).transfer(
        deployer.address,
        parseEther("1000000")
      );
      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(verybadguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          verybadguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("3000000"));

      expect(await cheel.balanceOf(verybadguy.address)).to.equal(parseEther("2000000"));

      await blockList.connect(moderator).addUsersToBlockList(
        [verybadguy.address]
      );
    });
  });

  describe("Internal Blocklist", async () => {
    it("Adding badguy for internal blocklist", async function () {
      await blockList.connect(moderator).addUsersToInternalBlockList(
        cheel.address,
        [badguy.address]
      );

      expect(await blockList.userIsInternalBlocked(cheel.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
      expect(await blockList.userIsInternalBlocked(cheel.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsInternalBlocked(cheel.address, verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
      expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
    });

    it("Blocking transactions for users in internal blocklist", async function () {
      await expectCustomError(
        cheel.connect(badguy).transfer(
          deployer.address,
          parseEther("1000000")
        ),
        "BlockedByInternalBlockList"
      );

      await expectCustomError(
        cheel.connect(deployer).transfer(
          badguy.address,
          parseEther("1000000")
        ),
        "BlockedByInternalBlockList"
      );

      await expectRevert(
        cheel.connect(badguy).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("3000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("2000000"));
    });

    it("Removing badguy from internal blocklist", async function () {
      await blockList.connect(moderator).removeUsersFromInternalBlockList(
        cheel.address,
        [badguy.address]
      );

      expect(await blockList.userIsInternalBlocked(cheel.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
    });

    it("UnBlocking transactions for users in internal blocklist and blocking again", async function () {
      result = await cheel.connect(badguy).transfer(
        deployer.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(badguy.address);
      expect(resultWaited.events[0].args.to).to.equal(deployer.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectRevert(
        cheel.connect(gnosis).transferFrom(
          badguy.address,
          deployer.address,
          parseEther("1000000")
        ),
        "ERC20: insufficient allowance"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("4000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("1000000"));

      await blockList.connect(moderator).addUsersToInternalBlockList(
        cheel.address,
        [badguy.address]
      );
    });
  });

  describe("Getting information about the presence of users from the list in the blocklist", async () => {
    it("Only internal blocklisted user", async function () {
      result = await blockList.connect(moderator).usersFromListIsBlocked(
        cheel.address,
        [deployer.address, receiver.address, badguy.address]
      );

      expect(result.toString()).to.equal(
        [badguy.address].toString()
      );
    });

    it("Internal and global blocklisted user", async function () {
      result = await blockList.connect(moderator).usersFromListIsBlocked(
        cheel.address,
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
    it("Adding Token limit", async function () {
      result = await blockList.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("1000000"),
        parseEther("1500000"),
        parseEther("1000000"),
        parseEther("1500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("1500000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("1500000").toString());

      result = await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.hasDailyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyIncomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasDailyOutcomeLimit).to.equal(true);
      expect(resultWaited.events[0].args.hasMonthlyOutcomeLimit).to.equal(true);

      {
        const _r = await blockList.getTokenLimits(cheel.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }
    });

    it("Testing Day and Month limits", async function () {

      // First transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("500000"));
      }
      // Second transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyOutcomeLimitReached"
      );

      // Getting Current Day
      const date = new Date();
      const year = date.toISOString().slice(0, 4);
      const month = date.toISOString().slice(5, 7);
      const day = date.toISOString().slice(8, 10);

      expect(String(await blockList.getCurrentDay())).to.equal(`${year}${month}${day}`);

      // Getting Current Month
      expect(String(await blockList.getCurrentMonth())).to.equal(`${year}${month}`);

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(parseEther("500000"));
      }

      // disable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        false,
        true
      );

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyIncomeLimitReached"
      );

      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        true
      );

      await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("1")
      );

      // Compare limits
      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("1000001"));
      }

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(parseEther("499999"));
      }

      // enable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      // Next Day transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("499999")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("499999").toString());

      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("499999"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("500001"));
        expect(_r[3]).to.equal(0);
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1")
        ),
        "MonthlyOutcomeLimitReached"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("2500000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
    });

    it("Increase limits", async function () {
      result = await blockList.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("500000"),
        parseEther("3000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.token).to.equal(cheel.address);
      expect(resultWaited.events[0].args.dailyIncomeLimit).to.equal(parseEther("1000000").toString());
      expect(resultWaited.events[0].args.monthlyIncomeLimit).to.equal(parseEther("3000000").toString());
      expect(resultWaited.events[0].args.dailyOutcomeLimit).to.equal(parseEther("500000").toString());
      expect(resultWaited.events[0].args.monthlyOutcomeLimit).to.equal(parseEther("3000000").toString());

      {
        const _r = await blockList.getTokenLimits(cheel.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }
    });

    it("Testing Day and Month limits", async function () {
      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("1"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, receiver.address);
        expect(_r[0]).to.equal(parseEther("500001"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("500000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyOutcomeLimitReached"
      );

      await blockList.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("500000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("500000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("500001"));
        expect(_r[3]).to.equal(parseEther("1500000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, receiver.address);
        expect(_r[0]).to.equal(parseEther("1"));
        expect(_r[1]).to.equal(parseEther("1500000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyIncomeLimitReached"
      );

      await blockList.connect(moderator).setTokenLimits(
        cheel.address,
        parseEther("1000000"),
        parseEther("3000000"),
        parseEther("1000000"),
        parseEther("3000000")
      );

      // First transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("500000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("500000").toString());

      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("999999"));
        expect(_r[3]).to.equal(parseEther("2000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("2")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next day
      await ethers.provider.send('evm_increaseTime', [24 * 60 * 60]);

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );

      // Next Day transaction
      result = await cheel.connect(deployer).transfer(
        receiver.address,
        parseEther("1000000")
      );

      resultWaited = await result.wait();

      expect(resultWaited.events[0].args.from).to.equal(deployer.address);
      expect(resultWaited.events[0].args.to).to.equal(receiver.address);
      expect(resultWaited.events[0].args.value).to.equal(parseEther("1000000").toString());

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );

      {
        const _r = await blockList.getUserTokenTransfers(cheel.address, deployer.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "DailyOutcomeLimitReached"
      );

      // disable day limits
      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        true
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, deployer.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(0);
        expect(_r[3]).to.equal(0);
      }

      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, receiver.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "MonthlyOutcomeLimitReached"
      );

      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        false,
        true,
        false,
        false
      );

      await expectCustomError(
        cheel.connect(deployer).transfer(
          receiver.address,
          parseEther("1000000")
        ),
        "MonthlyIncomeLimitReached"
      );
      
      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await cheel.balanceOf(badguy.address)).to.equal(parseEther("1000000"));
    });

    it("Testing Exclusion list", async function () {
      await blockList.connect(moderator).changeDisablingTokenLimits(
        cheel.address,
        true,
        true,
        true,
        true
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, exclusionContract.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, receiver.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await expectCustomError(
        cheel.connect(exclusionContract).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );

      await blockList.connect(moderator).addContractToExclusionList(exclusionContract.address);

      await expectCustomError(
        cheel.connect(clearLimitsUser).transfer(
          receiver.address,
          parseEther("1")
        ),
        "DailyIncomeLimitReached"
      );

      // Excluded contract outcome transaction
      await expectCustomError(
        cheel.connect(exclusionContract).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyIncomeLimitReached"
      );

      // Getting Remaining limit
      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, exclusionContract.address);
        expect(_r[0]).to.equal(parseEther("1000000"));
        expect(_r[1]).to.equal(parseEther("3000000"));
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      {
        const _r = await blockList.getUserRemainingLimit(cheel.address, receiver.address);
        expect(_r[0]).to.equal(0);
        expect(_r[1]).to.equal(0);
        expect(_r[2]).to.equal(parseEther("1000000"));
        expect(_r[3]).to.equal(parseEther("3000000"));
      }

      await blockList.connect(moderator).removeContractFromExclusionList(exclusionContract.address);

      await expectCustomError(
        cheel.connect(exclusionContract).transfer(
          receiver.address,
          parseEther("1500000")
        ),
        "DailyOutcomeLimitReached"
      );
    });
  });

  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        cheel.connect(deployer).mint(
          receiver.address,
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await cheel.balanceOf(receiver.address)).to.equal(parseEther("5000000"));

      expect(await cheel.totalSupply()).to.equal(parseEther("15000000"));
    });

    it("Burn from users", async function () {
      await expectRevert(
        cheel.connect(deployer).burn(
          parseEther("1000000")
        ),
        "Ownable: caller is not the owner"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await cheel.totalSupply()).to.equal(parseEther("15000000"));
    });

    it("Minting over max amount from owner", async function () {
      await expectCustomError(
        cheel.connect(gnosis).mint(
          gnosis.address,
          parseEther("1000000001")
        ),
        "MaxSupplyExceeded"
      );

      expect(await cheel.balanceOf(deployer.address)).to.equal(parseEther("1000000"));

      expect(await cheel.totalSupply()).to.equal(parseEther("15000000"));
    });
  });
});
