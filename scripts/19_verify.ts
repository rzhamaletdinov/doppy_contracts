const hre = require("hardhat");

export async function verify(address: string, args: any) {
  try {
    console.log("Waiting for 2 minutes before verification...");
    await new Promise((resolve) => setTimeout(resolve, 120000));
    return hre.run("verify:verify", { address: address, constructorArguments: args, });
  } catch (e) {
    console.log(e);
  }
}
