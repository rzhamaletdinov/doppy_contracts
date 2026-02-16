import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployCHEEL, deployBlockList } from "../utils/deployContracts";
import { Contract } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { expectCustomError } from "../utils/helpers";

describe("BlockList", () => {
  let blockList: Contract;
  let cheel: Contract;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let blockListGnosis: SignerWithAddress;
  let cheelGnosis: SignerWithAddress;

  before(async () => {
    [owner, user] = await ethers.getSigners();

    cheelGnosis = await ethers.getImpersonatedSigner("0x126481E4E79cBc8b4199911342861F7535e76EE7")
    await owner.sendTransaction({
      to: cheelGnosis.address,
      value: parseEther("1")
    })
    blockListGnosis = await ethers.getImpersonatedSigner("0x126481E4E79cBc8b4199911342861F7535e76EE7")
    await owner.sendTransaction({
      to: blockListGnosis.address,
      value: parseEther("1")
    })

  })

  beforeEach(async () => {
    blockList = await deployBlockList();

    cheel = await deployCHEEL();
  })

  it("No role setup upon deployment", async () => {
    expect(await blockList.hasRole(await blockList.BLOCKLIST_ADMIN_ROLE(), await blockList.GNOSIS_WALLET())).to.be.equal(true)
  })

  it("Bug in exclusion logic", async () => {
    await blockList.connect(blockListGnosis).setTokenLimits(cheel.address, 500, 500, 500, 100)
    await blockList.connect(blockListGnosis).changeDisablingTokenLimits(cheel.address, true, true, true, true)

    await cheel.connect(cheelGnosis).mint(owner.address, 200)

    await cheel.connect(cheelGnosis).setBlockList(blockList.address);

    await expectCustomError(
      cheel.connect(owner).transfer(user.address, 200),
      "MonthlyOutcomeLimitReached"
    )

    await blockList.connect(blockListGnosis).addContractToExclusionList(
      owner.address
    )

    await cheel.connect(owner).transfer(user.address, 200);

    expect(await cheel.balanceOf(user.address)).to.be.equal(200)
  })

  it("Underflow", async () => {
    await cheel.connect(cheelGnosis).setBlockList(blockList.address);
    await cheel.connect(cheelGnosis).mint(owner.address, 400)

    await blockList.connect(blockListGnosis).setTokenLimits(cheel.address, 500, 500, 500, 500)
    await blockList.connect(blockListGnosis).changeDisablingTokenLimits(cheel.address, true, true, true, true)

    await cheel.connect(owner).transfer(user.address, 400);
    {
      const _r = await blockList.getUserRemainingLimit(cheel.address, owner.address);
      expect(_r[0]).to.equal(500);
      expect(_r[1]).to.equal(500);
      expect(_r[2]).to.equal(100);
      expect(_r[3]).to.equal(100);
    }
    await blockList.connect(blockListGnosis).setTokenLimits(cheel.address, 300, 300, 300, 300)
    {
      const _r = await blockList.getUserRemainingLimit(cheel.address, owner.address);
      expect(_r[0]).to.equal(300);
      expect(_r[1]).to.equal(300);
      expect(_r[2]).to.equal(0);
      expect(_r[3]).to.equal(0);
    }
  })
})
