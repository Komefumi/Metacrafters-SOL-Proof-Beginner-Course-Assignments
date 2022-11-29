const {
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
  clusterApiUrl,
  Keypair,
  Transaction,
  SystemProgram,
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
    console.error(err);
    throw err;
  }
};

const operate = async () => {
  const theApiURL = clusterApiUrl("devnet");
  console.log({ theApiURL });
  const connection = new Connection(theApiURL, "confirmed");
  const names = {
    sender: "Sender",
    receiverOriginal: "Receiver (original)",
    receiverAnother: "Receiver (another guy)",
  };

  const gwb = (publicKey, name) =>
    getWalletBalance(publicKey, connection, name);

  const sender = Keypair.fromSecretKey(DEMO_FROM_SECRET_KEY);
  const receiverOriginal = Keypair.generate();
  const receiverAnother = Keypair.generate();

  await gwb(sender.publicKey, names.sender);
  await gwb(receiverOriginal.publicKey, names.receiverOriginal);

  console.log(
    `\n\nAirdopping some SOL (2 SOL) to ${names.sender} wallet to get started....\n\n`
  );
  const signatures = {};
  signatures.airDropToSender = await connection.requestAirdrop(
    new PublicKey(sender.publicKey),
    2 * LAMPORTS_PER_SOL
  );
  console.log("Airdrop complete, now confirming");
  const blockHashAfterAirdrop = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    blockhash: blockHashAfterAirdrop.blockhash,
    lastValidBlockHeight: blockHashAfterAirdrop.lastValidBlockHeight,
    signature: signatures.airDropToSender,
  });
  console.log(`Airdrop confirmed, now displaying ${names.sender} balance\n`);
  await gwb(sender.publicKey, names.sender);

  console.log(
    `\nGoing to transfer 0.01 SOL from ${names.sender} to ${names.receiverOriginal}`
  );

  const transactions = {};

  transactions.senderToReceiverOriginal = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiverOriginal.publicKey,
      lamports: LAMPORTS_PER_SOL / 100,
    })
  );

  signatures.senderToReceiverOriginal = await sendAndConfirmTransaction(
    connection,
    transactions.senderToReceiverOriginal,
    [sender]
  );
  console.log(
    `\nTransfer from ${names.sender} to ${names.receiverOriginal} complete\n`
  );
  await gwb(sender.publicKey, names.sender);
  await gwb(receiverOriginal.publicKey, names.receiverOriginal);

  console.log(
    `\nSignature of the transaction is ${signatures.senderToReceiverOriginal}\n`
  );

  console.log(
    `Going to transfer half of ${names.sender}'s balance to a third wallet. Let's call them: ${names.receiverAnother}\n`
  );
  await gwb(receiverAnother.publicKey, names.receiverAnother);

  const currentBalanceOfSender = await connection.getBalance(
    new PublicKey(sender.publicKey)
  );
  const halfOfSenderBalance = currentBalanceOfSender / 2;

  console.log(
    `\n${names.sender}'s current balance is ${
      currentBalanceOfSender / LAMPORTS_PER_SOL
    } SOL`
  );
  console.log(
    `Half of it (which we'll now send) is ${
      halfOfSenderBalance / LAMPORTS_PER_SOL
    } SOL`
  );

  transactions.senderToReceiverAnother = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiverAnother.publicKey,
      lamports: halfOfSenderBalance,
    })
  );

  signatures.senderToReceiverAnother = await sendAndConfirmTransaction(
    connection,
    transactions.senderToReceiverAnother,
    [sender]
  );
  console.log(
    `Transfer from ${names.sender} to ${names.receiverAnother} complete`
  );
  console.log(
    `\nSignature of this transaction is ${signatures.senderToReceiverAnother}`
  );

  console.log("\n\n\nDisplaying balances of all three wallets:\n\n");

  await gwb(sender.publicKey, names.sender);
  await gwb(receiverOriginal.publicKey, names.receiverOriginal);
  await gwb(receiverAnother.publicKey, names.receiverAnother);
};

operate();
