// import { expect } from "chai";
// import {
//   expectRevert,
//   constants,
//   // @ts-ignore
// } from "@openzeppelin/test-helpers";
// import { parseEther } from "ethers/lib/utils";
// import { ethers } from "hardhat";
// import {
//   CHEELConfig,
//   BlockListConfig,
//   LEEConfig,
//   NFTCasesConfig,
//   NFTGlassesConfig, NFTSaleConfig, TreasuryConfig
// } from '../config/ContractsConfig';
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { currentTimestamp, expectCustomError } from "../utils/helpers";
// import * as Sale from "./SaleEIP712";
// import * as Redeem from "./RedeemEIP712";
// import { Contract } from "ethers";
// import {
//   deployCHEEL,
//   deployBlockList,
//   deployLEE,
//   deployNFT,
//   deployNFTSale,
//   deployTreasury
// } from "../utils/deployContracts";



// describe(NFTGlassesConfig.contractName, () => {
//   let blockList: Contract;
//   let cheel: Contract;
//   let lee: Contract;
//   let nftGlasses: Contract;
//   let nftCases: Contract;
//   let nftSaleGlasses: Contract;
//   let nftSaleCases: Contract;
//   let treasury: Contract;
//   let usdt: Contract;
//   let nftGlassesGnosis: SignerWithAddress;
//   let nftCasesGnosis: SignerWithAddress;
//   let cheelGnosis: SignerWithAddress;
//   let leeGnosis: SignerWithAddress;
//   let blockListGnosis: SignerWithAddress;
//   let nftSaleGnosis: SignerWithAddress;
//   let treasuryGnosis: SignerWithAddress;
//   let etherHolder: SignerWithAddress;
//   let deployer: SignerWithAddress;
//   let receiver: SignerWithAddress;
//   let badguy: SignerWithAddress;
//   let moderator: SignerWithAddress;
//   let verybadguy: SignerWithAddress;
//   let tester: SignerWithAddress;
//   let BLOCKLIST_ADMIN_ROLE: string;
//   let result: any;
//   let resultWaited: any;
//   const price = parseEther("1");
//   const testBaseURI = "ipfs://ipfs/";

//   before(async () => {
//     // Create users
//     [etherHolder, deployer, receiver, badguy, moderator, verybadguy, tester] = await ethers.getSigners()

//     // Deploy Common BlockList
//     blockList = await deployBlockList();

//     // Deploy CHEEL
//     cheel = await deployCHEEL();

//     // Deploy LEE
//     lee = await deployLEE();

//     // Deploy NFT Glasses
//     nftGlasses = await deployNFT(NFTGlassesConfig.nftName, NFTGlassesConfig.nftSymbol);

//     // Deploy NFT Cases
//     nftCases = await deployNFT(NFTCasesConfig.nftName, NFTCasesConfig.nftSymbol);

//     // Deploy NFT SALE for Glasses
//     nftSaleGlasses = await deployNFTSale(
//       nftGlasses.address,
//       deployer.address,
//       price,
//       1000,
//       1000,
//     );

//     // Deploy NFT SALE for Cases
//     nftSaleCases = await deployNFTSale(
//       nftCases.address,
//       deployer.address,
//       price,
//       1000,
//       1000,
//     );

//     // Deploy USDT
//     const MockERC20Factory = await ethers.getContractFactory('MockERC20');
//     usdt = await MockERC20Factory.deploy('Tether token', 'USDT', 10000);

//     // Deploy Treasury
//     treasury = await deployTreasury(
//       deployer.address,
//       lee.address,
//       cheel.address,
//       usdt.address,
//     );

//     // Creating GNOSIS
//     nftGlassesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
//     nftCasesGnosis = await ethers.getImpersonatedSigner(NFTGlassesConfig.multiSigAddress)
//     cheelGnosis = await ethers.getImpersonatedSigner(CHEELConfig.multiSigAddress)
//     leeGnosis = await ethers.getImpersonatedSigner(LEEConfig.multiSigAddress)
//     blockListGnosis = await ethers.getImpersonatedSigner(BlockListConfig.multiSigAddress)
//     nftSaleGnosis = await ethers.getImpersonatedSigner(NFTSaleConfig.multiSigAddress)
//     treasuryGnosis = await ethers.getImpersonatedSigner(TreasuryConfig.multiSigAddress)
//     await etherHolder.sendTransaction({
//       to: NFTGlassesConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: NFTCasesConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: CHEELConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: LEEConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: BlockListConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: NFTSaleConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })
//     await etherHolder.sendTransaction({
//       to: TreasuryConfig.multiSigAddress,
//       value: ethers.utils.parseEther("1")
//     })

//     BLOCKLIST_ADMIN_ROLE = await blockList.BLOCKLIST_ADMIN_ROLE();
//   });

//   describe("Normal cases:", async () => {
//     it("Setting blocklist", async function () {
//       await nftGlasses.connect(nftGlassesGnosis).setBlockList(blockList.address);
//       await nftCases.connect(nftCasesGnosis).setBlockList(blockList.address);
//       await cheel.connect(cheelGnosis).setBlockList(blockList.address);
//       await lee.connect(leeGnosis).setBlockList(blockList.address);
//     });

//     it("Setting nft BASE URI", async function () {
//       await nftGlasses.connect(nftGlassesGnosis).setUri(
//         testBaseURI
//       );

//       await nftCases.connect(nftCasesGnosis).setUri(
//         testBaseURI
//       );
//     });

//     it("Setting nft sale and treasury contracts", async function () {
//       await nftGlasses.connect(nftGlassesGnosis).setSaleContract(nftSaleGlasses.address);
//       await nftGlasses.connect(nftGlassesGnosis).setTreasuryContract(treasury.address);

//       await nftCases.connect(nftCasesGnosis).setSaleContract(nftSaleCases.address);
//       await nftCases.connect(nftCasesGnosis).setTreasuryContract(treasury.address);
//     });

//     it("Check NFT Glosses initial data", async function () {
//       expect(await nftGlasses.name()).to.equal(NFTGlassesConfig.nftName);
//       expect(await nftGlasses.symbol()).to.equal(NFTGlassesConfig.nftSymbol);
//       expect((await nftGlasses.totalSupply()).toString()).to.equal('0');
//       expect((await nftGlasses.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());
//       expect((await nftGlasses.GNOSIS_WALLET()).toUpperCase()).to.equal(NFTGlassesConfig.multiSigAddress.toUpperCase());
//       expect((await nftGlasses.owner()).toUpperCase()).to.equal(NFTGlassesConfig.multiSigAddress.toUpperCase());
//       expect((await nftGlasses.nftSale()).toUpperCase()).to.equal(nftSaleGlasses.address.toUpperCase());
//       expect((await nftGlasses.treasury()).toUpperCase()).to.equal(treasury.address.toUpperCase());
//     });

//     it("Check NFT Cases initial data", async function () {
//       expect(await nftCases.name()).to.equal(NFTCasesConfig.nftName);
//       expect(await nftCases.symbol()).to.equal(NFTCasesConfig.nftSymbol);
//       expect((await nftCases.totalSupply()).toString()).to.equal('0');
//       expect((await nftCases.blockList()).toUpperCase()).to.equal(blockList.address.toUpperCase());
//       expect((await nftCases.GNOSIS_WALLET()).toUpperCase()).to.equal(NFTCasesConfig.multiSigAddress.toUpperCase());
//       expect((await nftCases.owner()).toUpperCase()).to.equal(NFTCasesConfig.multiSigAddress.toUpperCase());
//       expect((await nftCases.nftSale()).toUpperCase()).to.equal(nftSaleCases.address.toUpperCase());
//     });

//     it("Deployer distributes tokens to accounts", async () => {
//       // transfer USDT to accounts
//       await usdt.transfer(receiver.address, 1000);
//       await usdt.transfer(badguy.address, 1000);
//       await usdt.transfer(moderator.address, 1000);
//       await usdt.transfer(verybadguy.address, 1000);
//       await usdt.transfer(treasury.address, 1000);
//     });
//   });

//   describe("Tokens can be claimed:", async () => {
//     it("Only nft owner can mint nft", async function () {
//       result = await nftGlasses.connect(nftGlassesGnosis).safeMint(
//         nftGlassesGnosis.address,
//         0
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[0].args.to).to.equal(nftGlassesGnosis.address);
//       expect(resultWaited.events[0].args.tokenId).to.equal("0");

//       await expectRevert(
//         nftGlasses.connect(deployer).safeMint(
//           deployer.address,
//           1
//         ),
//         "Ownable: caller is not the owner"
//       );

//       expect(await nftGlasses.ownerOf(0)).to.equal(nftGlassesGnosis.address);

//       expect(await nftGlasses.balanceOf(nftGlassesGnosis.address)).to.equal(1);

//       expect(await nftGlasses.tokenURI(0)).to.equal(`${testBaseURI}0`);

//       expect((await nftGlasses.tokensOwnedByUser(nftGlassesGnosis.address)).length).to.equal(1);
//     });

//     it("purchase nft", async function () {
//       const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 1, address_to: deployer.address, ttl_timestamp: timestamp })
//       const signature2 = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 2, address_to: receiver.address, ttl_timestamp: timestamp })

//       await nftSaleGlasses.connect(deployer).purchase(
//         1,
//         timestamp,
//         signature,
//         {
//           value: price
//         }
//       );

//       expect(await nftGlasses.balanceOf(deployer.address)).to.equal(1);

//       await expectRevert(
//         nftSaleGlasses.connect(deployer).purchase(
//           1,
//           timestamp,
//           signature,
//           {
//             value: price
//           }
//         ),
//         "Can buy only once"
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(receiver).purchase(
//           2,
//           timestamp,
//           signature2,
//           {
//             value: parseEther("0.1")
//           }
//         ),
//         "Price not correct"
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(receiver).purchase(
//           2,
//           timestamp,
//           signature2,
//           {
//             value: parseEther("2")
//           }
//         ),
//         "Price not correct"
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(receiver).purchase(
//           2,
//           timestamp + 1,
//           signature2,
//           {
//             value: price
//           }
//         ),
//         "Bad signature"
//       );

//       await nftSaleGlasses.connect(receiver).purchase(
//         2,
//         timestamp,
//         signature2,
//         {
//           value: price
//         }
//       );

//       expect(await nftGlasses.balanceOf(receiver.address)).to.equal(1);
//     });

//     it("granting role for moderator in blocklist contract", async function () {
//       result = await blockList.connect(blockListGnosis).grantRole(
//         BLOCKLIST_ADMIN_ROLE,
//         moderator.address
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[0].args.role).to.equal(BLOCKLIST_ADMIN_ROLE);
//       expect(resultWaited.events[0].args.account).to.equal(moderator.address);

//       expect(await blockList.hasRole(BLOCKLIST_ADMIN_ROLE, moderator.address)).to.be.true;
//     });

//     it("adding verybadguy for Global Blocklist", async function () {
//       const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 4, address_to: verybadguy.address, ttl_timestamp: timestamp })

//       await blockList.connect(moderator).addUsersToBlockList(
//         [verybadguy.address]
//       );

//       expect(await blockList.userIsBlocked(badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;
//       expect(await blockList.userIsBlocked(verybadguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
//       expect(await blockList.userIsBlocked(deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;

//       await expectCustomError(
//         nftSaleGlasses.connect(verybadguy).purchase(
//           4,
//           timestamp,
//           signature,
//           {
//             value: price
//           }
//         ),
//         "BlockedByGlobalBlockList"
//       );

//       await blockList.connect(moderator).removeUsersFromBlockList(
//         [verybadguy.address]
//       );

//       await nftSaleGlasses.connect(verybadguy).purchase(
//         4,
//         timestamp,
//         signature,
//         {
//           value: price
//         }
//       );

//       expect(await nftGlasses.balanceOf(verybadguy.address)).to.equal(1);

//       await blockList.connect(moderator).addUsersToBlockList(
//         [verybadguy.address]
//       );
//     });

//     it("adding badguy for Internal Blocklist for glasses nft", async function () {
//       const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 5, address_to: badguy.address, ttl_timestamp: timestamp })

//       await blockList.connect(moderator).addUsersToInternalBlockList(
//         nftGlasses.address,
//         [badguy.address]
//       );

//       expect(await blockList.userIsInternalBlocked(nftGlasses.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.true;
//       expect(await blockList.userIsInternalBlocked(nftGlasses.address, deployer.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;

//       await expectCustomError(
//         nftSaleGlasses.connect(badguy).purchase(
//           5,
//           timestamp,
//           signature,
//           {
//             value: price
//           }
//         ),
//         "BlockedByInternalBlockList"
//       );

//       await blockList.connect(moderator).removeUsersFromInternalBlockList(
//         nftGlasses.address,
//         [badguy.address]
//       );

//       expect(await blockList.userIsInternalBlocked(nftGlasses.address, badguy.address, constants.ZERO_ADDRESS, constants.ZERO_ADDRESS)).to.be.false;

//       await nftSaleGlasses.connect(badguy).purchase(
//         5,
//         timestamp,
//         signature,
//         {
//           value: price
//         }
//       );

//       expect(await nftGlasses.balanceOf(badguy.address)).to.equal(1);
//       expect(await nftGlasses.balanceOf(receiver.address)).to.equal(1);

//       await blockList.connect(moderator).addUsersToInternalBlockList(
//         nftGlasses.address,
//         [badguy.address]
//       );
//     });

//     it("setting out of stock", async function () {
//       const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature3 = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 6, address_to: moderator.address, ttl_timestamp: timestamp })

//       await expectRevert(
//         nftSaleGlasses.connect(deployer).setPurchaseSupply(
//           0
//         ),
//         "Ownable: caller is not the owner"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).setPurchaseSupply(
//         0
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(moderator).purchase(
//           6,
//           timestamp,
//           signature3,
//           {
//             value: price
//           }
//         ),
//         "Out of stock"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).setPurchaseSupply(
//         1000
//       );

//       await nftSaleGlasses.connect(moderator).purchase(
//         6,
//         timestamp,
//         signature3,
//         {
//           value: price
//         }
//       );

//       expect(await nftGlasses.balanceOf(moderator.address)).to.equal(1);
//     });

//     it("setting new price", async function () {
//       const domain = Sale.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature4 = await signatureSigner._signTypedData(domain, Sale.Pass, { id: 7, address_to: tester.address, ttl_timestamp: timestamp })

//       await expectRevert(
//         nftSaleGlasses.connect(deployer).setPrice(
//           parseEther("2")
//         ),
//         "Ownable: caller is not the owner"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).setPrice(
//         parseEther("2")
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(tester).purchase(
//           7,
//           timestamp,
//           signature4,
//           {
//             value: price
//           }
//         ),
//         "Price not correct"
//       );

//       await nftSaleGlasses.connect(tester).purchase(
//         7,
//         timestamp,
//         signature4,
//         {
//           value: parseEther("2")
//         }
//       );

//       expect(await nftGlasses.balanceOf(tester.address)).to.equal(1);

//       await nftSaleGlasses.connect(nftSaleGnosis).setPrice(
//         price
//       );
//     });
//   });

//   describe("Redeem testing", async () => {
//     it("Testing Redeem", async function () {
//       const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature = await signatureSigner._signTypedData(domain, Redeem.Pass, { id: 8, address_to: deployer.address, ttl_timestamp: timestamp })
//       const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, { id: 9, address_to: badguy.address, ttl_timestamp: timestamp })
//       const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, { id: 10, address_to: verybadguy.address, ttl_timestamp: timestamp })

//       await nftSaleGlasses.connect(deployer).redeem(
//         8,
//         timestamp,
//         signature
//       );

//       expect(await nftGlasses.balanceOf(deployer.address)).to.equal(2);

//       await expectCustomError(
//         nftSaleGlasses.connect(badguy).redeem(
//           9,
//           timestamp,
//           signature2
//         ),
//         "BlockedByInternalBlockList"
//       );

//       await expectCustomError(
//         nftSaleGlasses.connect(verybadguy).redeem(
//           10,
//           timestamp,
//           signature3
//         ),
//         "BlockedByGlobalBlockList"
//       );
//     });

//     it("Testing out of stock", async function () {
//       const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature2 = await signatureSigner._signTypedData(domain, Redeem.Pass, { id: 9, address_to: receiver.address, ttl_timestamp: timestamp })

//       await expectRevert(
//         nftSaleGlasses.connect(deployer).setRedeemSupply(
//           0
//         ),
//         "Ownable: caller is not the owner"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).setRedeemSupply(
//         0
//       );

//       await expectRevert(
//         nftSaleGlasses.connect(receiver).redeem(
//           9,
//           timestamp,
//           signature2
//         ),
//         "Out of stock"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).setRedeemSupply(
//         1000
//       );

//       await nftSaleGlasses.connect(receiver).redeem(
//         9,
//         timestamp,
//         signature2
//       );

//       expect(await nftGlasses.balanceOf(receiver.address)).to.equal(2);
//     });

//     it("Testing pausing", async function () {
//       const domain = Redeem.eip712Domain(nftSaleGlasses.address, (await ethers.provider.getNetwork()).chainId)
//       const timestamp = await currentTimestamp() + 1000
//       const signatureSigner = await ethers.getImpersonatedSigner(deployer.address)
//       const signature3 = await signatureSigner._signTypedData(domain, Redeem.Pass, { id: 10, address_to: moderator.address, ttl_timestamp: timestamp })

//       await expectRevert(
//         nftSaleGlasses.connect(deployer).pauseRedeem(),
//         "Ownable: caller is not the owner"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).pauseRedeem();

//       await expectRevert(
//         nftSaleGlasses.connect(moderator).redeem(
//           10,
//           timestamp,
//           signature3
//         ),
//         "Redeeming paused"
//       );

//       await nftSaleGlasses.connect(nftSaleGnosis).pauseRedeem();

//       await nftSaleGlasses.connect(moderator).redeem(
//         10,
//         timestamp,
//         signature3
//       );

//       expect(await nftGlasses.balanceOf(moderator.address)).to.equal(2);
//     });

//     it("Testing withdrow", async function () {
//       await expectRevert(
//         nftSaleGlasses.connect(deployer).withdraw(),
//         "Ownable: caller is not the owner"
//       );

//       result = await nftSaleGlasses.connect(nftSaleGnosis).withdraw();
//       resultWaited = await result.wait();

//       expect(resultWaited.events[0].args.amount).to.equal(parseEther("7").toString());
//     });
//   });



//   describe("Getting information about the presence of users from the list in the blocklist", async () => {
//     it("Only internal blocklisted user", async function () {
//       result = await blockList.connect(receiver).usersFromListIsBlocked(
//         nftGlasses.address,
//         [deployer.address, receiver.address, badguy.address]
//       );

//       expect(result.toString()).to.equal(
//         [badguy.address].toString()
//       );
//     });

//     it("Internal and global blocklisted user", async function () {
//       result = await blockList.connect(verybadguy).usersFromListIsBlocked(
//         nftGlasses.address,
//         [deployer.address, receiver.address, badguy.address, verybadguy.address]
//       );

//       expect(result.toString()).to.equal(
//         [badguy.address, verybadguy.address].toString()
//       );
//     });

//     it("internal user is global blocklisted", async function () {
//       result = await blockList.connect(deployer).usersFromListIsBlocked(
//         constants.ZERO_ADDRESS,
//         [deployer.address, receiver.address, badguy.address, verybadguy.address]
//       );

//       expect(result.toString()).to.equal(
//         [verybadguy.address].toString()
//       );
//     });
//   });

//   describe("Tokens disabling", async () => {

//   });

//   describe("Tokens testing", async () => {
//     it("mint and withdraw cheel tokens from treasury", async function () {
//       await cheel.connect(cheelGnosis).mint(
//         treasury.address,
//         parseEther("100000")
//       );

//       result = await treasury.connect(deployer).withdraw(
//         10000,
//         1
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[1].args.user).to.equal(deployer.address);
//       expect(resultWaited.events[1].args.amount).to.equal("10000");
//       expect(resultWaited.events[1].args.option).to.equal("1");
//     });

//     it("adding new token", async function () {
//       const newTokenTest = await deployCHEEL();

//       result = await treasury.connect(treasuryGnosis).addToken(
//         newTokenTest.address
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[0].args.addr).to.equal(newTokenTest.address);

//       await newTokenTest.connect(cheelGnosis).mint(
//         treasury.address,
//         parseEther("100000")
//       );

//       result = await treasury.connect(deployer).withdraw(
//         10000,
//         3
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[1].args.user).to.equal(deployer.address);
//       expect(resultWaited.events[1].args.amount).to.equal("10000");
//       expect(resultWaited.events[1].args.option).to.equal("3");
//     });

//     it("tokens Owned By User", async function () {
//       {
//         const _r = await nftGlasses.tokensOwnedByUser(deployer.address);
//         expect(_r[0]).to.equal(1);
//         expect(_r[1]).to.equal(8);
//       }
//     });

//     it("USDT withdraw", async function () {
//       result = await treasury.connect(treasuryGnosis).withdrawToken(
//         usdt.address,
//         100
//       );
//       resultWaited = await result.wait();

//       expect(resultWaited.events[1].args.token).to.equal(usdt.address);
//       expect(resultWaited.events[1].args.amount).to.equal("100");

//       await expectRevert(
//         treasury.connect(deployer).withdrawToken(
//           usdt.address,
//           100
//         ),
//         "Ownable: caller is not the owner"
//       );
//     });
//   });
// });
