import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { TreasuryConfig, DOPPYConfig, BNHConfig } from "../config/ContractsConfig";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployTreasury, deployDOPPY, deployBNH } from "../utils/deployContracts";
import { Contract } from "ethers";
import { expectCustomError } from "../utils/helpers";

describe(TreasuryConfig.contractName, () => {
    let treasury: Contract;
    let doppy: Contract;
    let bnh: Contract;
    let mockUsdt: Contract; // Using extra BNH deploy as USDT mock
    let gnosis: SignerWithAddress;
    let etherHolder: SignerWithAddress;
    let deployer: SignerWithAddress;
    let recipient: SignerWithAddress;
    let signerWallet: SignerWithAddress;
    let badguy: SignerWithAddress;
    let chainId: number;

    // EIP712 domain and types for signing
    const EIP712_NAME = "TREASURY";
    const EIP712_VERSION = "1";

    const WithdrawSignatureTypes = {
        WithdrawSignature: [
            { name: "nonce", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "option", type: "uint256" },
        ],
    };

    function getEIP712Domain(contractAddress: string) {
        return {
            name: EIP712_NAME,
            version: EIP712_VERSION,
            chainId: chainId,
            verifyingContract: contractAddress,
        };
    }

    async function signWithdraw(
        signer: SignerWithAddress,
        contractAddress: string,
        nonce: number,
        amount: any,
        option: number
    ) {
        const domain = getEIP712Domain(contractAddress);
        const message = {
            nonce: nonce,
            amount: amount,
            option: option,
        };
        return signer._signTypedData(domain, WithdrawSignatureTypes, message);
    }

    before(async () => {
        [etherHolder, deployer, recipient, signerWallet, badguy] = await ethers.getSigners();

        // Get chain ID
        const network = await ethers.provider.getNetwork();
        chainId = network.chainId;

        // Deploy tokens
        doppy = await deployDOPPY();
        bnh = await deployBNH();
        mockUsdt = await deployBNH(); // Deploy another BNH as USDT mock

        // Deploy Treasury with signer
        treasury = await deployTreasury(
            recipient.address,
            doppy.address,
            bnh.address,
            mockUsdt.address,
            signerWallet.address
        );

        // Impersonate Gnosis wallet
        gnosis = await ethers.getImpersonatedSigner(TreasuryConfig.multiSigAddress);

        // Fund Gnosis wallet with ETH for gas
        await etherHolder.sendTransaction({
            to: TreasuryConfig.multiSigAddress,
            value: ethers.utils.parseEther("1"),
        });

        // Impersonate DOPPY Gnosis for minting
        const doppyGnosis = await ethers.getImpersonatedSigner(DOPPYConfig.multiSigAddress);
        await etherHolder.sendTransaction({
            to: DOPPYConfig.multiSigAddress,
            value: ethers.utils.parseEther("1"),
        });

        // Impersonate BNH Gnosis for minting
        const bnhGnosis = await ethers.getImpersonatedSigner(BNHConfig.multiSigAddress);
        await etherHolder.sendTransaction({
            to: BNHConfig.multiSigAddress,
            value: ethers.utils.parseEther("1"),
        });

        // Mint tokens to Treasury
        await doppy.connect(doppyGnosis).mint(treasury.address, parseEther("1000000"));
        await bnh.connect(bnhGnosis).mint(treasury.address, parseEther("1000000"));
        await mockUsdt.connect(bnhGnosis).mint(treasury.address, parseEther("1000000"));
    });

    describe("Initial data", () => {
        it("Should have correct signer", async () => {
            // Access contract function via functions.signer() to avoid conflict with signer property
            expect((await treasury.functions.signer())[0]).to.equal(signerWallet.address);
        });

        it("Should have correct recipient", async () => {
            expect(await treasury.recipient()).to.equal(recipient.address);
        });

        it("Should have correct owner (Gnosis)", async () => {
            expect((await treasury.owner()).toUpperCase()).to.equal(
                TreasuryConfig.multiSigAddress.toUpperCase()
            );
        });

        it("Should have correct allowed tokens", async () => {
            expect(await treasury.allowedTokens(0)).to.equal(doppy.address);
            expect(await treasury.allowedTokens(1)).to.equal(bnh.address);
            expect(await treasury.allowedTokens(2)).to.equal(mockUsdt.address);
        });
    });

    describe("verifySignature", () => {
        it("Should return correct signer address", async () => {
            const nonce = 100;
            const amount = parseEther("100");
            const option = 0;

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);
            const recovered = await treasury.verifySignature(nonce, amount, option, signature);

            expect(recovered).to.equal(signerWallet.address);
        });

        it("Should return different address for wrong signer", async () => {
            const nonce = 101;
            const amount = parseEther("100");
            const option = 0;

            const signature = await signWithdraw(badguy, treasury.address, nonce, amount, option);
            const recovered = await treasury.verifySignature(nonce, amount, option, signature);

            expect(recovered).to.not.equal(signerWallet.address);
            expect(recovered).to.equal(badguy.address);
        });

        it("Should return different address for wrong chainId", async () => {
            const nonce = 102;
            const amount = parseEther("100");
            const option = 0;

            // Create signature with wrong chainId
            const wrongChainIdDomain = {
                name: EIP712_NAME,
                version: EIP712_VERSION,
                chainId: 999999, // Wrong chainId
                verifyingContract: treasury.address,
            };

            const message = {
                nonce: nonce, // Use correct nonce
                amount: amount,
                option: option,
            };

            // Manually sign with wrong domain
            const signature = await signerWallet._signTypedData(wrongChainIdDomain, WithdrawSignatureTypes, message);

            const recovered = await treasury.verifySignature(nonce, amount, option, signature);

            expect(recovered).to.not.equal(signerWallet.address);
        });
    });

    describe("withdraw", () => {
        it("Should withdraw with valid signature", async () => {
            const nonce = 1;
            const amount = parseEther("100");
            const option = 0; // DOPPY

            const balanceBefore = await doppy.balanceOf(recipient.address);

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);

            await expect(treasury.withdraw(nonce, amount, option, signature))
                .to.emit(treasury, "TokenWithdrawn")
                .withArgs(recipient.address, amount, option);

            const balanceAfter = await doppy.balanceOf(recipient.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
        });

        it("Should withdraw BNH (option 1)", async () => {
            const nonce = 2;
            const amount = parseEther("200");
            const option = 1; // BNH

            const balanceBefore = await bnh.balanceOf(recipient.address);

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);
            await treasury.withdraw(nonce, amount, option, signature);

            const balanceAfter = await bnh.balanceOf(recipient.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
        });

        it("Should withdraw mock USDT (option 2)", async () => {
            const nonce = 3;
            const amount = parseEther("300");
            const option = 2; // mockUsdt

            const balanceBefore = await mockUsdt.balanceOf(recipient.address);

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);
            await treasury.withdraw(nonce, amount, option, signature);

            const balanceAfter = await mockUsdt.balanceOf(recipient.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
        });

        it("Should revert on reused nonce (SignatureAlreadyUsed)", async () => {
            const nonce = 4;
            const amount = parseEther("50");
            const option = 0;

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);

            // First call succeeds
            await treasury.withdraw(nonce, amount, option, signature);

            // Second call with same nonce should revert
            await expectCustomError(
                treasury.withdraw(nonce, amount, option, signature),
                "SignatureAlreadyUsed"
            );
        });

        it("Should revert on bad signature (BadSignature)", async () => {
            const nonce = 5;
            const amount = parseEther("50");
            const option = 0;

            // Sign with wrong signer
            const signature = await signWithdraw(badguy, treasury.address, nonce, amount, option);

            await expectCustomError(
                treasury.withdraw(nonce, amount, option, signature),
                "BadSignature"
            );
        });

        it("Should revert on disabled token (OptionDisabled)", async () => {
            const nonce = 6;
            const amount = parseEther("50");
            const option = 0;

            // Disable token first
            await treasury.connect(gnosis).disableToken(option);

            const signature = await signWithdraw(signerWallet, treasury.address, nonce, amount, option);

            await expectCustomError(
                treasury.withdraw(nonce, amount, option, signature),
                "OptionDisabled"
            );

            // Re-enable by adding token back
            await treasury.connect(gnosis).addToken(doppy.address);
        });
    });

    describe("Admin functions", () => {
        it("setSigner: should update signer", async () => {
            await expect(treasury.connect(gnosis).setSigner(badguy.address))
                .to.emit(treasury, "SignerUpdated")
                .withArgs(badguy.address);

            expect((await treasury.functions.signer())[0]).to.equal(badguy.address);

            // Restore original signer
            await treasury.connect(gnosis).setSigner(signerWallet.address);
            expect((await treasury.functions.signer())[0]).to.equal(signerWallet.address);
        });

        it("setSigner: should revert for non-owner", async () => {
            await expect(
                treasury.connect(badguy).setSigner(badguy.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("setSigner: should revert for zero address", async () => {
            await expectCustomError(
                treasury.connect(gnosis).setSigner(ethers.constants.AddressZero),
                "ZeroAddress"
            );
        });

        it("addToken: should add new token", async () => {
            await expect(treasury.connect(gnosis).addToken(doppy.address))
                .to.emit(treasury, "TokenAdded")
                .withArgs(doppy.address);
        });

        it("addToken: should revert for zero address", async () => {
            await expectCustomError(
                treasury.connect(gnosis).addToken(ethers.constants.AddressZero),
                "ZeroAddress"
            );
        });

        it("addToken: should revert for non-owner", async () => {
            await expect(
                treasury.connect(badguy).addToken(doppy.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("disableToken: should disable token", async () => {
            // Add a token to disable (index 3+ from previous addToken)
            const tokensCount = 4; // 3 initial + 1 added in previous test
            await expect(treasury.connect(gnosis).disableToken(tokensCount - 1))
                .to.emit(treasury, "TokenDisabled")
                .withArgs(tokensCount - 1);
        });

        it("disableToken: should revert for non-owner", async () => {
            await expect(
                treasury.connect(badguy).disableToken(0)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("setRecipient: should update recipient", async () => {
            await expect(treasury.connect(gnosis).setRecipient(deployer.address))
                .to.emit(treasury, "RecipientUpdated")
                .withArgs(deployer.address);

            expect(await treasury.recipient()).to.equal(deployer.address);

            // Restore
            await treasury.connect(gnosis).setRecipient(recipient.address);
        });

        it("setRecipient: should revert for zero address", async () => {
            await expectCustomError(
                treasury.connect(gnosis).setRecipient(ethers.constants.AddressZero),
                "ZeroAddress"
            );
        });

        it("setRecipient: should revert for non-owner", async () => {
            await expect(
                treasury.connect(badguy).setRecipient(badguy.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });

        it("withdrawToken: should allow owner to withdraw", async () => {
            const amount = parseEther("10");

            const balanceBefore = await doppy.balanceOf(gnosis.address);

            await expect(treasury.connect(gnosis).withdrawToken(doppy.address, amount))
                .to.emit(treasury, "TokenWithdrawnByOwner")
                .withArgs(doppy.address, amount);

            const balanceAfter = await doppy.balanceOf(gnosis.address);
            expect(balanceAfter.sub(balanceBefore)).to.equal(amount);
        });

        it("withdrawToken: should revert for non-owner", async () => {
            await expect(
                treasury.connect(badguy).withdrawToken(doppy.address, parseEther("10"))
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
