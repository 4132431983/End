const { ethers } = require("ethers");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

// Configuration
const PRIVATE_KEY = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258"; // Your wallet private key
const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT address
const DESTINATION = "0x08f695b8669b648897ed5399b9b5d951b72881a0"; // Where to send USDT
const RPC_URL = "https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn"; // RPC provider (e.g., Alchemy or Infura)
const ETHEREUM_NETWORK = "mainnet"; // Network name (mainnet or goerli)

async function main() {
  // Connect to Ethereum provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  // Initialize Flashbots provider
  const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    wallet // Authenticator wallet
  );

  // USDT Contract
  const usdtAbi = [
    "function transfer(address to, uint amount) public returns (bool)",
  ];
  const usdtContract = new ethers.Contract(USDT_CONTRACT, usdtAbi, wallet);

  // Transaction data
  const usdtAmount = ethers.parseUnits("2100", 6); // USDT has 6 decimals
  const gasLimit = 100000; // Adjust if needed

  // Prepare transaction
  const tx = await usdtContract.populateTransaction.transfer(
    DESTINATION,
    usdtAmount
  );

  const gasPrice = await provider.getGasPrice();

  // Build Flashbots transaction bundle
  const signedTx = await wallet.signTransaction({
    ...tx,
    gasLimit: ethers.BigNumber.from(gasLimit),
    gasPrice: gasPrice,
    nonce: await provider.getTransactionCount(wallet.address),
  });

  const bundle = [
    {
      signedTransaction: signedTx,
    },
  ];

  // Send bundle to Flashbots
  const blockNumber = await provider.getBlockNumber();
  const response = await flashbotsProvider.sendBundle(bundle, blockNumber + 1);

  if ("error" in response) {
    console.error("Flashbots error:", response.error.message);
    return;
  }

  console.log("Bundle submitted! Waiting for confirmation...");

  const receipt = await response.wait();
  if (receipt === 0) {
    console.log("Bundle was not included in the block.");
  } else {
    console.log("Bundle executed in block:", receipt);
  }
}

main();