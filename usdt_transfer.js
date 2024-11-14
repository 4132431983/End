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
const web3 = new Web3('https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn');

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
const senderAccount = web3.eth.accounts.privateKeyToAccount(SENDER_PRIVATE_KEY);
const gasPayerAccount = web3.eth.accounts.privateKeyToAccount(GAS_PAYER_PRIVATE_KEY);

// Set the USDT contract
const usdtContract = new web3.eth.Contract(USDT_ABI, USDT_CONTRACT_ADDRESS);

// Function to send USDT and pay gas with another wallet
async function sendUSDT() {
  try {
    // Get gas price from Alchemy
    const gasPrice = await web3.eth.getGasPrice();
    
    // Estimate gas for the transaction
    const gasLimit = await usdtContract.methods.transfer(DESTINATION_ADDRESS, web3.utils.toWei(AMOUNT_TO_SEND, 'mwei')).estimateGas({
      from: SENDER_ADDRESS
    });

    // Create the transaction
    const tx = {
      from: SENDER_ADDRESS,
      to: USDT_CONTRACT_ADDRESS,
      gas: gasLimit,
      gasPrice: gasPrice,
      data: usdtContract.methods.transfer(DESTINATION_ADDRESS, web3.utils.toWei(AMOUNT_TO_SEND, 'mwei')).encodeABI(),
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