const { ethers } = require("ethers");

// Configuration: Replace with your details
const privateKey = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258"; // Your wallet private key
const provider = new ethers.JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn"); // Your RPC provider (e.g., Infura/Alchemy)
const wallet = new ethers.Wallet(privateKey, provider);

const usdtAddress = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT ERC20 contract address
const usdtAbi = [
  "function transfer(address to, uint amount) public returns (bool)",
];
const usdtContract = new ethers.Contract(usdtAddress, usdtAbi, wallet);

const destinationAddress = "0x08f695b8669b648897ed5399b9b5d951b72881a0"; // Destination wallet
const usdtAmount = ethers.parseUnits("2100", 6); // Amount to transfer (USDT has 6 decimals)

const gasLimit = 100000n; // Estimated gas limit for USDT transfer (adjust if needed)

// Function to estimate transaction cost
async function estimateGasCost() {
  const feeData = await provider.getFeeData(); // Fetch gas price and fee data
  const gasPrice = feeData.gasPrice;
  const estimatedCost = gasPrice * gasLimit;
  return { gasPrice, estimatedCost };
}

// Function to check ETH balance and initiate transfer
async function monitorAndTransfer() {
  while (true) {
    try {
      // Get wallet's ETH balance
      const balance = await provider.getBalance(wallet.address);

      // Estimate gas cost
      const { gasPrice, estimatedCost } = await estimateGasCost();

      console.log(
        `Checking balance... Current ETH: ${ethers.formatEther(
          balance
        )}, Estimated Gas Cost: ${ethers.formatEther(estimatedCost)}`
      );

      // Proceed if balance covers the estimated gas cost
      if (balance >= estimatedCost) {
        console.log("Sufficient ETH detected. Initiating USDT transfer...");

        // Send the USDT transfer
        const tx = await usdtContract.transfer(destinationAddress, usdtAmount, {
          gasLimit: gasLimit, // Set gas limit
          gasPrice: gasPrice, // Use the current gas price
        });

        console.log("Transaction sent:", tx.hash);

        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.transactionHash);

        // Exit script after successful transaction
        break;
      } else {
        console.log("Insufficient ETH. Waiting...");
      }
    } catch (error) {
      console.error("Error during monitoring/transfer:", error.message);
    }

    // Wait for a few seconds before checking again
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Adjust interval as needed
  }
}

// Start monitoring and transfer process
monitorAndTransfer();