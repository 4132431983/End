require('dotenv').config();
const Web3 = require('web3');
console.log("0x4de23f3f0fb3318287378adbde030cf61714b2f3:", SENDER_ADDRESS);
console.log("0x08f695b8669b648897ed5399b9b5d951b72881a0:", DESTINATION_ADDRESS);
console.log("0xdac17f958d2ee523a2206206994597c13d831ec7:", USDT_CONTRACT_ADDRESS);
const SENDER_ADDRESS = "0x4de23f3f0fb3318287378adbde030cf61714b2f3";
console.log("Sender Address:", SENDER_ADDRESS);
// Load environment variables
const {
  ALCHEMY_API_URL,
  SENDER_PRIVATE_KEY,
  SENDER_ADDRESS,
  DESTINATION_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  AMOUNT_TO_SEND
} = process.env;


// Initialize Web3
const web3 = new Web3(ALCHEMY_API_URL);

// Validate address inputs
if (!web3.utils.isAddress(SENDER_ADDRESS) || !web3.utils.isAddress(DESTINATION_ADDRESS) || !web3.utils.isAddress(USDT_CONTRACT_ADDRESS)) {
  throw new Error("One or more Ethereum addresses are invalid. Check SENDER_ADDRESS, DESTINATION_ADDRESS, and USDT_CONTRACT_ADDRESS in your .env file.");
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

    // Create the transaction
    const tx = {
      from: SENDER_ADDRESS,
      to: USDT_CONTRACT_ADDRESS,
      gas: gasLimit,
      gasPrice: gasPrice,
      data: usdtContract.methods.transfer(DESTINATION_ADDRESS, amountInWei).encodeABI(),
    };

    // Sign the transaction using the sender's private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, SENDER_PRIVATE_KEY);

    // Send the signed transaction
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Transaction successful with hash: ${receipt.transactionHash}`);
  } catch (error) {
    console.error(`Error during transaction: ${error.message}`);
  }
}

sendUSDT();
