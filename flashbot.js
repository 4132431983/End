const { ethers } = require("ethers");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

// Configuration
const providerUrl = "https://eth-mainnet.alchemyapi.io/v2/qA9FV5BMTFx6p7638jhqx-JDFDByAZAn"; // Or use Alchemy or your local node provider
const privateKey = "ee9cec01ff03c0adea731d7c5a84f7b412bfd062b9ff35126520b3eb3d5ff258"; // The private key of the wallet you are using
const destinationWallet = "0x08f695b8669b648897ed5399b9b5d951b72881a0"; // The address you want to send USDT to
const usdtContractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7"; // USDT ERC20 contract address

// Connect to Ethereum provider
const provider = new ethers.JsonRpcProvider(providerUrl);

// Wallet and Signer
const wallet = new ethers.Wallet(privateKey, provider);

// USDT Contract ABI (for ERC20 transfer)
const usdtAbi = [
  "function transfer(address recipient, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)"
];

const usdtContract = new ethers.Contract(usdtContractAddress, usdtAbi, wallet);

// Function to check if ETH balance is enough to cover the gas fee
async function checkEthBalanceAndTransfer() {
    try {
        // Get ETH balance of the wallet
        const ethBalance = await provider.getBalance(wallet.address);
        console.log("Wallet ETH Balance: ", ethers.utils.formatEther(ethBalance));

        // Gas fee estimation
        const gasPrice = await provider.getGasPrice();
        const gasLimit = 100000; // Adjust based on transaction complexity
        const estimatedGasFee = gasPrice.mul(gasLimit); // Gas fee in ETH

        // Check if wallet has enough ETH to cover the gas fee
        if (ethBalance.lt(estimatedGasFee)) {
            console.log("Not enough ETH for gas. Waiting for ETH...");
            // Wait for the ETH balance to be sufficient
            await waitForEth(estimatedGasFee);
        }

        // Check the USDT balance of the wallet
        const balance = await usdtContract.balanceOf(wallet.address);
        console.log("Wallet USDT Balance: ", ethers.utils.formatUnits(balance, 6));

        // Define the amount of USDT you want to send
        const amountToSend = ethers.utils.parseUnits("2100", 6); // Adjust the amount (e.g., 100 USDT)

        // Check if the wallet has enough USDT
        if (balance.lt(amountToSend)) {
            console.log("Insufficient USDT balance.");
            return;
        }

        // Prepare transaction to transfer USDT
        const tx = await usdtContract.populateTransaction.transfer(destinationWallet, amountToSend);

        // Adjust gas price (you can also use gas loan services here if needed)
        tx.gasPrice = gasPrice;
        tx.gasLimit = gasLimit;

        // Send the transaction through Flashbots (to avoid front-running)
        const flashbotsProvider = await FlashbotsBundleProvider.create(provider, wallet, "mainnet");
        const signedTx = await wallet.signTransaction(tx);

        // Send the bundle using Flashbots
        const bundleSubmission = await flashbotsProvider.sendBundle(
            [{
                signer: wallet,
                transaction: signedTx
            }],
            await provider.getBlockNumber() + 1 // Send to the next block
        );

        console.log("Transaction Hash: ", bundleSubmission.bundleHash);
        const receipt = await provider.waitForTransaction(bundleSubmission.bundleHash);
        console.log("Transaction Receipt: ", receipt);

    } catch (error) {
        console.error("Error during transaction: ", error);
    }
}

// Function to wait until the wallet has enough ETH for the gas fee
async function waitForEth(requiredAmount) {
    let ethBalance;
    while (true) {
        ethBalance = await provider.getBalance(wallet.address);
        if (ethBalance.gte(requiredAmount)) {
            console.log("ETH balance is sufficient for gas fee.");
            break;
        } else {
            console.log(`Waiting for ETH... Current balance: ${ethers.utils.formatEther(ethBalance)}`);

await new Promise(resolve => setTimeout(resolve, 60000)); // Wait for 1 minute before checking again
        }
    }
}

// Run the check and transfer process
checkEthBalanceAndTransfer().catch(console.error);