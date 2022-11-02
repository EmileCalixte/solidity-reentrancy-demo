import { ethers } from "hardhat";
import { Attacker, VulnerableContract } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main(performAttack: boolean) {
    console.log("=== DEPLOYMENT ===");
    const { vulnerableContract, attacker } = await deployContracts();
    console.log("");

    const accounts = await ethers.getSigners();

    console.log("=== NORMAL CONTRACT USAGE ===");
    await sendEthersFromOtherAccounts(vulnerableContract, accounts.slice(-5));
    console.log("");

    console.log("=== ATTACK ===");
    if (performAttack) {
        await attack(attacker, vulnerableContract);
    } else {
        console.log("(no attack)");
    }
    console.log("");

    console.log("=== OTHER ACCOUNTS TRY TO WITHDRAW ===");
    if (performAttack) {
        console.log("(An error should be thrown because VulnerableContract is now empty)");
    }
    await tryToWithdraw(vulnerableContract, accounts.slice(-5));
    console.log("");
}

async function deployContracts() {
    const VulnerableContract = await ethers.getContractFactory("VulnerableContract");
    const vulnerableContract = await VulnerableContract.deploy();

    await vulnerableContract.deployed();

    const Attacker = await ethers.getContractFactory("Attacker");
    const attacker = await Attacker.deploy(vulnerableContract.address);

    await attacker.deployed();

    console.log(`VulnerableContract deployed to ${vulnerableContract.address}`);
    console.log(`Attacker deployed to ${attacker.address}`);

    return { vulnerableContract, attacker };
}

async function sendEthersFromOtherAccounts(vulnerableContract: VulnerableContract, accounts: SignerWithAddress[]) {
    const amountPerAccount = "10";

    for (const account of accounts) {
        console.log(`Sending ${amountPerAccount} ETH to VulnerableContract from ${account.address} (balance: ${
            ethers.utils.formatEther(await account.getBalance())
        } ETH)`);

        await account.sendTransaction({
            to: vulnerableContract.address,
            value: ethers.utils.parseEther("10"),
        });

        console.log(`Sent - New VulnerableContract balance: ${
            ethers.utils.formatEther(await vulnerableContract.provider.getBalance(vulnerableContract.address))
        } ETH`);

        console.log(`New balance of ${account.address}: ${
            ethers.utils.formatEther(await account.getBalance())
        } ETH`)

        console.log("");
    }
}

async function attack(attacker: Attacker, vulnerableContract: VulnerableContract) {
    console.log("Sending 1 ETH to VulnerableContract through Attacker contract");

    await attacker.initialize({value: ethers.utils.parseEther("1")});

    console.log(`Sent - New VulnerableContract balance: ${
        ethers.utils.formatEther(await vulnerableContract.provider.getBalance(vulnerableContract.address))
    } ETH`);

    console.log(`Attacker's balance on VulnerableContract: ${
        ethers.utils.formatEther(await vulnerableContract.balances(attacker.address))
    } ETH`);

    console.log("Calling Attacker's attack function");

    await attacker.attack();

    console.log(`Done - New VulnerableContract balance: ${
        ethers.utils.formatEther(await vulnerableContract.provider.getBalance(vulnerableContract.address))
    } ETH`);

    console.log(`Attacker's balance on VulnerableContract: ${
        ethers.utils.formatEther(await vulnerableContract.balances(attacker.address))
    } ETH`);

    console.log(`Attacker's balance: ${
        ethers.utils.formatEther(await attacker.provider.getBalance(attacker.address))
    } ETH`);
}

async function tryToWithdraw(vulnerableContract: VulnerableContract, accounts: SignerWithAddress[]) {
    for (const account of accounts) {
        console.log(`Withdrawing from VulnerableContract for ${account.address} (balance: ${
            ethers.utils.formatEther(await account.getBalance())
        } ETH)`);

        await vulnerableContract.connect(account).withdraw();

        console.log(`Success - New VulnerableContract balance: ${
            ethers.utils.formatEther(await vulnerableContract.provider.getBalance(vulnerableContract.address))
        } ETH`);

        console.log(`New balance of ${account.address}: ${
            ethers.utils.formatEther(await account.getBalance())
        } ETH`)

        console.log("");
    }
}

(async function() {
    console.log("######################");
    console.log("### WITHOUT ATTACK ###");
    console.log("######################");
    console.log("");

    await main(false);

    console.log("");
    console.log("");
    console.log("######################");
    console.log("###  WITH  ATTACK  ###");
    console.log("######################");
    console.log("");

    await main(true); // Should throw error
})();
