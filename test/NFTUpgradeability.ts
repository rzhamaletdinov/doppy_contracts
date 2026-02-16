// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import {
//   expectRevert,
//   constants,
//   // @ts-ignore
// } from "@openzeppelin/test-helpers";
// import { ethers, upgrades } from "hardhat";
// import { deployBlockList } from "../utils/deployContracts"
// import { Contract } from "ethers";
// import { BlockListConfig, NFTGlassesConfig } from "../config/ContractsConfig";
// import { expect } from "chai";
// import { expectCustomError } from "../utils/helpers";


// describe(`OLD${NFTGlassesConfig.contractName} Upgrade`, () => {
//   let oldNft: Contract;
//   let nft: Contract;
//   let blockList: Contract;
//   let gnosis: SignerWithAddress;
//   let blockListGnosis: SignerWithAddress;
//   let etherHolder: SignerWithAddress;
//   let deployer: SignerWithAddress;
//   let receiver: SignerWithAddress;
//   let badguy: SignerWithAddress;
//   let moderator: SignerWithAddress;
//   let BLOCKLIST_ADMIN_ROLE: string;
//   let result: any;
//   let resultWaited: any;

//   before(async () => {
//     // Deploy OLDNFT
//     const OLDNFT = await ethers.getContractFactory("OLDNFT");
//     oldNft = await upgrades.deployProxy(OLDNFT, ["NFT Test NFT", "NTN"], { initializer: "initialize" });
//     await oldNft.deployed();

//     // Deploy BlockList
//     blockList = await deployBlockList();

//     // Creating GNOSIS
//     [etherHolder, deployer, receiver, badguy, moderator] = await ethers.getSigners();
//     gnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
//     blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
//     await etherHolder.sendTransaction({
//       to: NFTGlassesConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: BlockListConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })

//     BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
//   });

//   it("Mint NFT", async () => {
//     result = await oldNft.connect(gnosis).safeMint(
//       gnosis.address,
//       0
//     );
//     resultWaited = await result.wait();

//     expect(resultWaited.events[0].args.to).to.equal(gnosis.address);
//     expect(resultWaited.events[0].args.tokenId).to.equal("0");
//   });

//   it("tokens Owned By User", async function () {
//     const tokens = await oldNft.tokensOwnedByUser(gnosis.address);
//     expect(tokens.length).to.equal(1);
//     expect(tokens[0]).to.equal(0);
//   });

//   it('Upgrade old NFT', async function () {
//     let NFT = await ethers.getContractFactory("NFT");

//     nft = await upgrades.upgradeProxy(oldNft.address, NFT)
//   });

//   it("Mint NFT 2", async () => {
//     result = await nft.connect(gnosis).safeMint(
//       gnosis.address,
//       1
//     );
//     resultWaited = await result.wait();

//     expect(resultWaited.events[0].args.to).to.equal(gnosis.address);
//     expect(resultWaited.events[0].args.tokenId).to.equal("1");
//   })

//   it("Setting blockList", async function () {
//     await nft.connect(gnosis).setBlockList(blockList.address);
//   });

//   it("Grant BLOCKLIST_ADMIN_ROLE for moderator", async function () {
//     await blockList.connect(blockListGnosis).grantRole(
//       BLOCKLIST_ADMIN_ROLE,
//       moderator.address
//     );
//   });

//   it("Adding badguy for blocklist", async function () {
//     expect((await nft.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());

//     await blockList.connect(moderator).addUsersToBlockList(
//       [badguy.address]
//     );

//     expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
//   });

//   it("New function added works", async () => {
//     await expectCustomError(
//       nft.connect(gnosis).safeMint(
//         badguy.address,
//         2
//       ),
//       "BlockedByGlobalBlockList"
//     );
//   })

//   it("Balancies is correct", async function () {
//     expect(await nft.balanceOf(gnosis.address)).to.equal(2);
//   });

//   it("tokens Owned By User", async function () {
//     {
//       const _r = await oldNft.tokensOwnedByUser(gnosis.address);
//       expect(_r[0]).to.equal(0);
//       expect(_r[1]).to.equal(1);
//     }
//   });
// });
