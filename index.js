// Import Solana web3 functinalities
const {
  Connection,
  PublicKey,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} = require("@solana/web3.js");

try {
  const publicKeyFromUser = process.argv[2];
  const isValidPublicKeyString = PublicKey.isOnCurve(publicKeyFromUser);
  if (!isValidPublicKeyString) {
    throw new Error(
      "Not a valid public key kind of string...: " + publicKeyFromUser
    );
  }
  // Exact the public and private key from the keypair
  const publicKey = new PublicKey(publicKeyFromUser).toString();

  // Connect to the Devnet
  console.log("Public Key of the generated keypair", publicKey);

  // Get the wallet balance from a given private key
  const getWalletBalance = async () => {
    try {
      // Connect to the Devnet
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      // console.log("Connection object is:", connection);

      const walletBalance = await connection.getBalance(
        new PublicKey(publicKey)
      );
      console.log(
        `Wallet balance: ${parseInt(walletBalance) / LAMPORTS_PER_SOL} SOL`
      );
    } catch (err) {
      console.log(err);
    }
  };

  const airDropSol = async () => {
    try {
      // Connect to the Devnet
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

      // Request airdrop of 2 SOL to the wallet
      console.log("Airdropping some SOL to my wallet!");
      const fromAirDropSignature = await connection.requestAirdrop(
        new PublicKey(publicKey),
        2 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(fromAirDropSignature);
    } catch (err) {
      console.log(err);
    }
  };

  // Show the wallet balance before and after airdropping SOL
  const mainFunction = async () => {
    await getWalletBalance();
    await airDropSol();
    await getWalletBalance();
  };

  mainFunction();
} catch (err) {
  console.error(err);
  process.exit(1);
}
