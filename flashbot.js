const { ethers } = require("ethers");

const USDT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // Replace with actual USDT address
const USDT_ABI = [
  "function transfer(address to, uint amount) public returns (bool)"
];

// Replace with your Ethereum provider and private key
const provider = new ethers.providers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn");
const wallet = new ethers.Wallet("ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258", provider);

const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, wallet);

async function main() {
  const destinationAddress = "0x08f695b8669b648897ed5399b9b5d951b72881a0"; // Replace with the actual recipient address
  const amount = ethers.utils.parseUnits("2100", 6); // Specify amount in USDT (assuming 6 decimals)

  try {
    const tx = await usdtContract.populateTransaction.transfer(destinationAddress, amount);
    console.log("Transaction populated:", tx);
  } catch (error) {
    console.error("Error populating transaction:", error);
  }
}

main();