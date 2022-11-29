// Import Solana web3 functinalities
const {
  Connection,
  PublicKey,
  clusterApiUrl,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmRawTransaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

const DEMO_FROM_SECRET_KEY = new Uint8Array([
  127, 197, 18, 138, 207, 16, 172, 24, 17, 65, 2, 47, 129, 101, 45, 140, 91,
  127, 52, 192, 150, 139, 181, 14, 129, 154, 225, 58, 217, 211, 206, 38, 63,
  174, 2, 5, 167, 69, 76, 203, 92, 169, 38, 169, 181, 233, 25, 172, 41, 184, 49,
  122, 90, 5, 35, 75, 8, 36, 225, 82, 227, 125, 245, 244,
]);

const getWalletBalance = async (publicKey, conn, name) => {
  try {
    const walletBalance = await conn.getBalance(new PublicKey(publicKey));
    console.log(
      `Wallet balance for ${name}: ${
        parseInt(walletBalance) / LAMPORTS_PER_SOL
      } SOL`
    );
  } catch (err) {
    console.log(err);
  }
};

const transferSol = async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  // Get Keypair from Secret Key
  var from = Keypair.fromSecretKey(DEMO_FROM_SECRET_KEY);

  // Other things to try:
  // 1) Form array from userSecretKey
  // const from = Keypair.fromSecretKey(Uint8Array.from(userSecretKey));
  // 2) Make a new Keypair (starts with 0 SOL)
  // const from = Keypair.generate();

  // Generate another Keypair (account we'll be sending to)
  const to = Keypair.generate();

  // Aidrop 2 SOL to Sender wallet
  await getWalletBalance(from.publicKey, connection, "Sender");
  console.log("Airdopping some SOL to Sender wallet!");
  const fromAirDropSignature = await connection.requestAirdrop(
    new PublicKey(from.publicKey),
    2 * LAMPORTS_PER_SOL
  );
  await getWalletBalance(from.publicKey, connection, "Sender");
  await getWalletBalance(to.publicKey, connection, "Receiver");
  // Latest blockhash (unique identifer of the block) of the cluster
  let latestBlockHash = await connection.getLatestBlockhash();

  // Confirm transaction using the last valid block height (refers to its time)
  // to check for transaction expiration
  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: fromAirDropSignature,
  });

  console.log("Airdrop completed for the Sender account");
  await getWalletBalance(from.publicKey, connection, "Sender");

  // Send money from "from" wallet and into "to" wallet
  var transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: from.publicKey,
      toPubkey: to.publicKey,
      lamports: LAMPORTS_PER_SOL / 100,
    })
  );

  // Sign transaction
  var signature = await sendAndConfirmTransaction(connection, transaction, [
    from,
  ]);
  console.log("Transfer from sender to receiver complete");
  await getWalletBalance(from.publicKey, connection, "Sender");
  await getWalletBalance(to.publicKey, connection, "Receiver");
  console.log("Signature is ", signature);
};

transferSol();
