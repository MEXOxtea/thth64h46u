const solanaWeb3 = require('@solana/web3.js');
const bs58 = require('bs58');

// Function to create a new Solana wallet
const createWallet = async () => {
  // Generate a new keypair
  const keypair = solanaWeb3.Keypair.generate();

  // Extract the public and private keys
  const publicKey = keypair.publicKey.toString();
  const privateKey = bs58.encode(keypair.secretKey);

  console.log('Public Key:', publicKey);
  console.log('Private Key:', privateKey);

  return { publicKey, privateKey };
};

// Create a new wallet and display the keys
createWallet();
