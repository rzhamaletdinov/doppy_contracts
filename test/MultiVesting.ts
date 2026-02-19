import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { MultiVesting } from "../typechain";
import { deployBNH, deployMultiVesting } from "../utils/deployContracts"
import { currentTimestamp, expectCustomError, increaseTime } from "../utils/helpers"


describe("MultiVesting", function () {
  let bnh: Contract
  let vesting: MultiVesting
  let owner: SignerWithAddress
  let receiver: SignerWithAddress
  let receiver2: SignerWithAddress
  let receiver3: SignerWithAddress
  let receiver4: SignerWithAddress
  let gnosisBNH: SignerWithAddress
  let gnosisMV: SignerWithAddress
  let amount = 1000
  let day = 60 * 60 * 24
  let getDay = (num: number) => { return num * day }

  before(async () => {
    [owner, receiver, receiver2, receiver3, receiver4] = await ethers.getSigners()

    bnh = await deployBNH()
    vesting = await deployMultiVesting(bnh.address, true, true)

    gnosisMV = await ethers.getImpersonatedSigner(await vesting.GNOSIS_WALLET())
    gnosisBNH = await ethers.getImpersonatedSigner(await bnh.GNOSIS_WALLET())

    await owner.sendTransaction({ to: gnosisMV.address, value: ethers.utils.parseEther("0.3") })
    await owner.sendTransaction({ to: gnosisBNH.address, value: ethers.utils.parseEther("0.3") })
  })

  beforeEach(async () => {
    bnh = await deployBNH()
    vesting = await deployMultiVesting(bnh.address, true, true)

    await vesting.connect(gnosisMV).setManager(await owner.getAddress())
  })

  it("Vest and vestingAmount work", async () => {
    expect(await vesting.vestingAmount()).to.be.equal(0)
    await expectCustomError(
      vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp(), 1000, 0, 100),
      "InvalidAmount"
    )
    await expectCustomError(
      vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp() - 1, 1000, amount, 100),
      "InsufficientTokens"
    )
    expect(await vesting.vestingAmount()).to.be.equal(0)

    await bnh.connect(gnosisBNH).mint(vesting.address, amount)

    expect(await vesting.vestingAmount()).to.be.equal(0)
    await vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp() - 1, 1000, amount, 100)
    expect(await vesting.vestingAmount()).to.be.equal(amount)

    expect(await vesting.vestingAmount()).to.be.equal(amount)

    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(vesting.address, await currentTimestamp() - 1, 1000, amount, 100)
    expect(await vesting.vestingAmount()).to.be.equal(amount * 2)

    // Validation tests
    await expectCustomError(
      vesting.createVestingSchedule(ethers.constants.AddressZero, await currentTimestamp(), 1000, 100, 100),
      "ZeroAddress"
    )
    await expectCustomError(
      vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp(), 0, 100, 100),
      "InvalidDuration"
    )
    await expectCustomError(
      vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp(), 1000, 100, 0),
      "InvalidCliff"
    )
    await expectCustomError(
      vesting.createVestingSchedule(await owner.getAddress(), await currentTimestamp(), 1000, 100, 100),
      "BeneficiaryAlreadyExists"
    )
    await expectCustomError(
      vesting.connect(receiver4).createVestingSchedule(await owner.getAddress(), await currentTimestamp(), 1000, 100, 100),
      "OnlyManager"
    )
  })

  it("Cliff works", async () => {
    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(owner.address, await currentTimestamp() - 1, 1000, amount, 100)

    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(52)

    await increaseTime(50)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(102)
  })

  it("Releasable And VestedAmount works works", async () => {
    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(owner.address, await currentTimestamp() - 1, 1000, amount, 100)

    await increaseTime(100)

    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(102)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(103)

    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(103)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    expect(await bnh.balanceOf(await owner.getAddress())).to.be.equal(103)

    await increaseTime(899)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await increaseTime(amount)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(897)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await vesting.release(await owner.getAddress())
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.releasable(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[0]).to.be.equal(amount)
    expect((await vesting.vestedAmountBeneficiary(await owner.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[0]).to.be.equal(0)
    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1]).to.be.equal(0)
  })


  it("Blocking works", async () => {
    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(vesting.address, await currentTimestamp() - 1, 1000, amount, 100)

    let fakeToken = await deployBNH()

    await fakeToken.connect(gnosisBNH).mint(vesting.address, amount)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(0)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(amount)
    expect(await vesting.vestingAmount()).to.be.not.equal(0)
    await vesting.connect(gnosisMV).emergencyVest(fakeToken.address)
    expect(await vesting.vestingAmount()).to.be.not.equal(0)
    expect(await fakeToken.balanceOf(gnosisMV.address)).to.be.equal(amount)
    expect(await fakeToken.balanceOf(vesting.address)).to.be.equal(0)

    expect(await bnh.balanceOf(vesting.address)).to.be.equal(amount)
    expect(await vesting.connect(gnosisMV).emergencyVest(bnh.address)).to.be.ok
    expect(await bnh.balanceOf(vesting.address)).to.be.equal(0)

    await vesting.connect(gnosisMV).disableEarlyWithdraw()
    await expectCustomError(
      vesting.connect(gnosisMV).emergencyVest(bnh.address),
      "OptionDisabled"
    )
  })

  it("change beneficiary works", async () => {
    console.log(await bnh.balanceOf(vesting.address), await vesting.vestingAmount());
    await bnh.connect(gnosisBNH).mint(vesting.address, amount * 2)
    await vesting.connect(owner).createVestingSchedule(owner.address, await currentTimestamp() - 1, 1000, amount, 100)

    console.log(await bnh.balanceOf(vesting.address), await vesting.vestingAmount());
    await expectCustomError(
      vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver4.address),
      "UserIsNotBeneficiary"
    )
    await vesting.connect(owner).updateBeneficiary(owner.address, receiver4.address)
    await vesting.createVestingSchedule(await receiver2.getAddress(), await currentTimestamp(), 1, amount, 1)
    await expectCustomError(
      vesting.connect(receiver2).updateBeneficiary(receiver2.address, owner.address),
      "BeneficiaryAlreadyExists"
    )
    expect((await vesting.releasable(await receiver2.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)

    await vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver3.address)
    await vesting.connect(receiver2).updateBeneficiary(receiver2.address, receiver3.address)

    await expectCustomError(
      vesting.connect(receiver3).finishUpdateBeneficiary(receiver2.address),
      "UpdateLockPeriodNotPassed"
    )
    await expectCustomError(
      vesting.connect(receiver3).finishUpdateBeneficiary(receiver3.address),
      "NoPendingUpdate"
    )
    await increaseTime(100)

    await expectCustomError(
      vesting.connect(receiver3).finishUpdateBeneficiary(receiver3.address),
      "NoPendingUpdate"
    )
    await vesting.connect(receiver3).finishUpdateBeneficiary(receiver2.address)

    await expectCustomError(
      vesting.connect(receiver2).updateBeneficiary(receiver3.address, receiver2.address),
      "Unauthorized"
    )
    await vesting.connect(receiver3).updateBeneficiary(receiver3.address, receiver2.address)
    await expectCustomError(
      vesting.connect(receiver2).updateBeneficiary(receiver3.address, receiver2.address),
      "Unauthorized"
    )
    await increaseTime(201)
    await expectCustomError(
      vesting.connect(receiver2).finishUpdateBeneficiary(receiver3.address),
      "UpdateLockPeriodExpired"
    )

    expect((await vesting.releasable(await receiver2.getAddress(), await currentTimestamp()))[1]).to.be.equal(0)
    expect((await vesting.releasable(await receiver3.getAddress(), await currentTimestamp()))[1]).to.be.equal(amount)
    await increaseTime(1000)
    await expectCustomError(
      vesting.connect(owner).updateBeneficiary(owner.address, receiver3.address),
      "UpdatePending"
    )
    await expectCustomError(
      vesting.connect(owner).finishUpdateBeneficiary(owner.address),
      "UpdateLockPeriodExpired"
    )

  })

  it("vesting update and create", async () => {
    console.log("can't update non-existing");
    await expectCustomError(
      vesting.updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, 50),
      "UserIsNotBeneficiary"
    )

    console.log("create vesting");
    await bnh.connect(gnosisBNH).mint(vesting.address, 1000)
    await vesting.createVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, amount, 100)

    console.log("can't update vesting when balance and _amount > 0");
    await bnh.connect(gnosisBNH).mint(vesting.address, 1000)
    await expectCustomError(
      vesting.createVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, amount, 50),
      "BeneficiaryAlreadyExists"
    )

    console.log("can't update vest when cliff more than older and _amount = 0");
    await expectCustomError(
      vesting.updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, 150),
      "CliffCannotBeIncreased"
    )

    console.log("can update vest when cliff less than older and amount = 0");
    await vesting.updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, 50)

    // Validation tests for updateVestingSchedule
    await expectCustomError(
      vesting.updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 0, 50),
      "InvalidDuration"
    )
    await expectCustomError(
      vesting.updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, 0),
      "InvalidCliff"
    )
    await expectCustomError(
      vesting.connect(receiver4).updateVestingSchedule(await receiver4.getAddress(), await currentTimestamp(), 1000, 50),
      "OnlyManager"
    )
  })

  it("Vesting created for passed timestamp (duration >= cliff)", async () => {
    let currentTime = await currentTimestamp()
    let oldTimestamp = currentTime - getDay(60)

    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(receiver.address, oldTimestamp, getDay(60), amount, getDay(60) + 10)

    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(receiver2.address, oldTimestamp, getDay(60), amount, getDay(60) - 10)

    expect((await vesting.releasable(await receiver.getAddress(), currentTime - 5))[0].toNumber()).to.be.equal(0)
    expect((await vesting.releasable(await receiver2.getAddress(), currentTime - 5))[0].toNumber()).to.be.greaterThanOrEqual(950)

    expect((await vesting.releasable(await receiver.getAddress(), currentTime))[1]).to.be.equal(amount)
    expect((await vesting.releasable(await receiver2.getAddress(), currentTime))[1]).to.be.equal(amount)
  })

  it.skip("Vesting created for passed timestamp (duration < cliff)", async () => {
    let currentTime = await currentTimestamp()
    let oldTimestamp = currentTime - getDay(60)

    await bnh.connect(gnosisBNH).mint(vesting.address, amount)
    await vesting.createVestingSchedule(receiver.address, oldTimestamp, getDay(60), amount, getDay(70))

    //should work
    expect((await vesting.releasable(await receiver.getAddress(), getDay(69)))[0].toNumber()).to.be.equal(0)
    expect((await vesting.releasable(await receiver.getAddress(), getDay(71)))[0].toNumber()).to.be.equal(amount)
  })

  it("change amount of recipient", async () => {
    let currentTime = await currentTimestamp()

    await bnh.connect(gnosisBNH).mint(vesting.address, amount * 3)
    await vesting.connect(owner).createVestingSchedule(receiver.address, currentTime, getDay(3), amount, getDay(5))

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), currentTime))[1].toNumber()).to.be.equal(amount)

    await vesting.connect(gnosisMV).updateBeneficiary(receiver.address, receiver2.address)
    await increaseTime(110)
    await vesting.connect(gnosisMV).finishUpdateBeneficiary(receiver.address)

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(0)
    expect((await vesting.vestedAmountBeneficiary(await receiver2.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount)

    await vesting.connect(owner).createVestingSchedule(receiver.address, currentTime, getDay(3), amount * 2, getDay(5) + 2)
    await vesting.connect(owner).updateVestingSchedule(receiver2.address, currentTime, 2, 2)

    expect((await vesting.vestedAmountBeneficiary(await receiver.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount * 2)
    expect((await vesting.vestedAmountBeneficiary(await receiver2.getAddress(), await currentTimestamp()))[1].toNumber()).to.be.equal(amount)

    await increaseTime(10)

    expect(await bnh.balanceOf(await receiver2.getAddress())).to.be.equal(0)
    await vesting.release(await receiver2.getAddress())
    expect(await bnh.balanceOf(await receiver2.getAddress())).to.be.equal(1000)
  })

  it("should block emergency vesting when disabled upon deployment", async () => {
    vesting = await deployMultiVesting(bnh.address, true, false)

    await expectCustomError(
      vesting.connect(gnosisMV).emergencyVest(bnh.address),
      "OptionDisabled"
    )
  })
})
