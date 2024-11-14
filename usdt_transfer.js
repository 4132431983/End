require('dotenv').config();
const Web3 = require('web3');


// Load environment variables
const {
  ALCHEMY_API_URL,
  SENDER_PRIVATE_KEY,
  GAS_PAYER_PRIVATE_KEY,
  SENDER_ADDRESS,
  DESTINATION_ADDRESS,
  USDT_CONTRACT_ADDRESS,
  AMOUNT_TO_SEND
} = process.env;
// Initialize Web3
const web3 = new Web3("https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn");
// USDT ERC-20 ABI (simplified for transfer)
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Set up accounts
const senderAccount = web3.eth.accounts.privateKeyToAccount("0xee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258");
const gasPayerAccount = web3.eth.accounts.privateKeyToAccount("0x793678405b2f54a9d5435bdf617ca94568027716522a7459215a6c0a35106e8c");

// Set the USDT contract
const usdtContract = new web3.eth.Contract(USDT_ABI, "0xdac17f958d2ee523a2206206994597c13d831ec7");

// Function to send USDT and pay gas with another wallet
async function sendUSDT() {
  try {
    // Get gas price from Alchemy
    const gasPrice = await web3.eth.getGasPrice();
    
    // Estimate gas for the transaction
    const gasLimit = await usdtContract.methods.transfer("0x551510dFb352bf6C0fCC50bA7Fe94cB1d2182654", web3.utils.toWei('2300', 'mwei')).estimateGas({
      from: "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3"
    });

    // Create the transaction
    const tx = {
      from: "0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3",
      to: "0xdac17f958d2ee523a2206206994597c13d831ec7",
      gas: gasLimit,
      gasPrice: gasPrice,
      data: usdtContract.methods.transfer("0x551510dFb352bf6C0fCC50bA7Fe94cB1d2182654", web3.utils.toWei(2300, 'mwei')).encodeABI(),
    };

    // Sign the transaction using the sender's private key
    const signedTx = await web3.eth.accounts.signTransaction(tx, senderAccount.privateKey);

    // Send the transaction (this sends USDT)
    const txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log(`Transaction successful with hash: ${txHash.transactionHash}`);

    // Now pay for the gas fee using the gas payer's wallet
    const gasTx = {
      from: gasPayerAccount.address,
      to: txHash.transactionHash,
      value: web3.utils.toWei('0.01', 'ether'),  // You can adjust the fee amount here
      gas: 21000,  // Standard gas for a transaction
      gasPrice: gasPrice
    };

    // Sign and send the gas transaction
    const signedGasTx = await web3.eth.accounts.signTransaction(gasTx, gasPayerAccount.privateKey);
    const gasTxHash = await web3.eth.sendSignedTransaction(signedGasTx.rawTransaction);
    console.log(`Gas transaction sent: ${gasTxHash.transactionHash}`);

  } catch (error) {
    console.error(`Error during transaction: ${error.message}`);
  }
}

sendUSDT();