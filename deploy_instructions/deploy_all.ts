import { ethers, upgrades } from 'hardhat';
import {
    BlockListConfig,
    DOPPYConfig,
    BNHConfig,
    TreasuryConfig
} from '../config/ContractsConfigProd';
import { verify } from "../scripts/19_verify";

async function main() {
    console.log('--- Starting System Deployment ---');

    // 1. Deploy BlockList
    console.log('\n[1/4] Deploying BlockList...');
    const BlockListContract = await ethers.getContractFactory(BlockListConfig.contractName);
    const blockListProxy = await upgrades.deployProxy(BlockListContract, [], { initializer: 'initialize' });
    await blockListProxy.deployed();
    const blockListImpl = await upgrades.erc1967.getImplementationAddress(blockListProxy.address);
    const blockListAdmin = await upgrades.erc1967.getAdminAddress(blockListProxy.address);
    console.log(`BlockList Proxy: ${blockListProxy.address}`);
    console.log(`BlockList Impl: ${blockListImpl}`);
    console.log(`BlockList Admin: ${blockListAdmin}`);

    // 2. Deploy DOPPY
    console.log('\n[2/4] Deploying DOPPY...');
    const DOPPYContract = await ethers.getContractFactory(DOPPYConfig.contractName);
    const doppyProxy = await upgrades.deployProxy(DOPPYContract, [], { initializer: 'initialize' });
    await doppyProxy.deployed();
    const doppyImpl = await upgrades.erc1967.getImplementationAddress(doppyProxy.address);
    const doppyAdmin = await upgrades.erc1967.getAdminAddress(doppyProxy.address);
    console.log(`DOPPY Proxy: ${doppyProxy.address}`);
    console.log(`DOPPY Impl: ${doppyImpl}`);
    console.log(`DOPPY Admin: ${doppyAdmin}`);

    // 3. Deploy BNH
    console.log('\n[3/4] Deploying BNH...');
    const BNHContract = await ethers.getContractFactory(BNHConfig.contractName);
    const bnhProxy = await upgrades.deployProxy(BNHContract, [], { initializer: 'initialize' });
    await bnhProxy.deployed();
    const bnhImpl = await upgrades.erc1967.getImplementationAddress(bnhProxy.address);
    const bnhAdmin = await upgrades.erc1967.getAdminAddress(bnhProxy.address);
    console.log(`BNH Proxy: ${bnhProxy.address}`);
    console.log(`BNH Impl: ${bnhImpl}`);
    console.log(`BNH Admin: ${bnhAdmin}`);

    // 4. Deploy Treasury
    console.log('\n[4/4] Deploying Treasury...');
    const TreasuryContract = await ethers.getContractFactory(TreasuryConfig.contractName);

    // USDT address in BSC Mainnet (use as dummy for local deploy to pass Zero check)
    const USDT_ADDRESS = "0x55d398326f99059ff775485246999027b3197955";
    const RECIPIENT_ADDRESS = "";
    const SIGNER_ADDRESS = "";

    const treasuryProxy = await upgrades.deployProxy(TreasuryContract, [
        RECIPIENT_ADDRESS, // recipient address
        doppyProxy.address,
        bnhProxy.address,
        USDT_ADDRESS, // USDT address
        SIGNER_ADDRESS // signer address (placeholder to be updated later by owner)
    ], { initializer: 'initialize' });
    await treasuryProxy.deployed();
    const treasuryImpl = await upgrades.erc1967.getImplementationAddress(treasuryProxy.address);
    const treasuryAdmin = await upgrades.erc1967.getAdminAddress(treasuryProxy.address);
    console.log(`Treasury Proxy: ${treasuryProxy.address}`);
    console.log(`Treasury Impl: ${treasuryImpl}`);
    console.log(`Treasury Admin: ${treasuryAdmin}`);

    // 6. Wait before verification
    console.log('\n--- Waiting 120 seconds before verification ---');
    console.log('Waiting for the blockchain to index the deployments...');
    await new Promise(resolve => setTimeout(resolve, 120 * 1000));

    // 7. Verify all contracts
    console.log('\n--- Starting Verification ---');
    console.log('Verifying BlockList...');
    try { await verify(blockListImpl, []); } catch (e) { console.error('Verification failed for BlockList:', e); }

    console.log('Verifying DOPPY...');
    try { await verify(doppyImpl, []); } catch (e) { console.error('Verification failed for DOPPY:', e); }

    console.log('Verifying BNH...');
    try { await verify(bnhImpl, []); } catch (e) { console.error('Verification failed for BNH:', e); }

    console.log('Verifying Treasury...');
    try { await verify(treasuryImpl, []); } catch (e) { console.error('Verification failed for Treasury:', e); }

    console.log('\n--- Deployment Successfully Finished ---');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
