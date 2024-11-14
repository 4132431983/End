require('dotenv').config();
const Web3 = require('web3');

// Address and private key setup
const SENDER_ADDRESS = "0x4de23f3f0fb3318287378adbde030cf61714b2f3";
console.log("Sender Address:", SENDER_ADDRESS);

const SENDER_PRIVATE_KEY = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258";
console.log("Sender Private Key:", SENDER_PRIVATE_KEY);

const DESTINATION_ADDRESS = "0x08f695b8669b648897ed5399b9b5d951b72881a0";
console.log("Destination Address:", DESTINATION_ADDRESS);

const USDT_CONTRACT_ADDRESS = "0xdac17f958d2ee523a2206206994597c13d831ec7";
console.log("USDT Contract Address:", USDT_CONTRACT_ADDRESS);

const AMOUNT_TO_SEND = "2100";
console.log("Amount to Send:", AMOUNT_TO_SEND);

// Gas Payer Wallet Setup
const GAS_PAYER_ADDRESS = "0x088dafbbb838d8e34cc62b632fc0179e264d2df9";
const GAS_PAYER_PRIVATE_KEY = "0xadcc0b91bdbb96d3a8145f2f12e205a0d5465420bfb5aeb81e8df307443506ed";
console.log("Gas Payer Address:", GAS_PAYER_ADDRESS);

// Alchemy API URL setup (Use Sepolia test network)
const ALCHEMY_API_URL = process.env.ALCHEMY_API_URL || 'https://eth-sepolia.g.alchemy.com/v2/0hXI9wapnNwxo8F-sTZVaV_zpN3mlTyk';

// Initialize Web3 with the Alchemy API URL
const web3 = new Web3(new Web3.providers.HttpProvider(ALCHEMY_API_URL));

// Confirm connection by fetching the latest block number
web3.eth.getBlockNumber()
    .then((blockNumber) => console.log("Connected to Ethereum Sepolia. Latest block number:", blockNumber))
    .catch((error) => console.error("Connection error:", error));

// Validate address inputs
if (!web3.utils.isAddress(SENDER_ADDRESS) || 
    !web3.utils.isAddress(DESTINATION_ADDRESS) || 
    !web3.utils.isAddress(USDT_CONTRACT_ADDRESS) ||
    !web3.utils.isAddress(GAS_PAYER_ADDRESS)) {
  throw new Error("One or more Ethereum addresses are invalid.");
}

// USDT ERC-20 ABI (simplified for transfer)
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Set the USDT contract
const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);

// Function to get USDT balance of sender
async function getUSDTBalance() {
  try {
    const balance = await usdtContract.methods.balanceOf(SENDER_ADDRESS).call();
    console.log(`USDT Balance of Sender: ${web3.utils.fromWei(balance, 'mwei')} USDT`);
  } catch (error) {
    console.error(`Error fetching USDT balance: ${error.message}`);
  }
}

// Function to send USDT
async function sendUSDT() {
  try {
    // Get gas price from the network
    const gasPrice = await web3.eth.getGasPrice();

    // Convert amount to send from USDT (6 decimals) to wei
    const amountInWei = web3.utils.toWei(AMOUNT_TO_SEND, 'mwei'); // mwei = 6 decimals for USDT

    // Estimate gas for the transaction
    const gasLimit = await usdtContract.methods.transfer(DESTINATION_ADDRESS, amountInWei).estimateGas({
      from: SENDER_ADDRESS,
    });
    console.log(`Estimated Gas Limit: ${gasLimit}`);

    // Calculate the minimum fee required for the transaction
    const minFee = web3.utils.fromWei((gasLimit * gasPrice).toString(), 'ether');
    console.log(`Minimum Transaction Fee: ${minFee} ETH`);

    // Create the transaction
    const tx = {
      from: SENDER_ADDRESS,
      to: USDT_CONTRACT_ADDRESS,
      gas: gasLimit,
      gasPrice: gasPrice,
      data: usdtContract.methods.transfer(DESTINATION_ADDRESS, amountInWei).encodeABI(),
    };

    // Sign the transaction using the gas payer's private key for the gas fee
    const signedTx = await web3.eth.accounts.signTransaction(tx, GAS_PAYER_PRIVATE_KEY);

    // Send the signed transaction
const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Transaction successful with hash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error(`Error during transaction: ${error.message}`);
  }
}

// Get the USDT balance of sender and execute the sendUSDT function
(async () => {
  await getUSDTBalance();
  await sendUSDT();
})();
    