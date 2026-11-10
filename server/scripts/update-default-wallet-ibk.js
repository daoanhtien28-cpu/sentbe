const mongoose = require('mongoose');

async function checkAndFix(uri, label) {
  console.log(`\nChecking ${label}...`);
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const wallets = await db.collection('wallets').find({}).toArray();
  console.log(`Found ${wallets.length} wallets`);
  for (const w of wallets) {
    console.log(`Wallet ${w._id}: code=${w.linkedBankCode}, name=${w.linkedBankName}, img=${w.imageUrl}`);
    // If the wallet was created with the previous NH default, update it to IBK
    if (w.linkedBankCode === 'NH' || w.imageUrl === 'assets/images/bank/bank_nh.png') {
      await db.collection('wallets').updateOne(
        { _id: w._id },
        {
          $set: {
            linkedBankCode: 'IBK',
            linkedBankName: 'Industrial Bank of Korea',
            imageUrl: 'assets/images/bank/bank_ibk.png',
            updatedAt: new Date(),
          },
        }
      );
      console.log(`Updated wallet ${w._id} to IBK`);
    }
  }

  // Also update transactions that used paymentBank NH as default if needed
  const txs = await db.collection('transactions').find({ 'paymentBank.bankCode': 'NH' }).toArray();
  for (const tx of txs) {
    await db.collection('transactions').updateOne(
      { _id: tx._id },
      {
        $set: {
          'paymentBank.bankCode': 'IBK',
          'paymentBank.name': 'Industrial Bank of Korea',
          'paymentBank.imageUrl': 'assets/images/bank/bank_ibk.png',
          transferChannel: 'IBK',
          updatedAt: new Date(),
        },
      }
    );
    console.log(`Updated tx ${tx._id} paymentBank to IBK`);
  }

  await mongoose.disconnect();
}

async function run() {
  const devUri = 'mongodb+srv://daoanhtien232001_db_user:emVFLDKp4dBkb4yE@cluster0.obcykjf.mongodb.net';
  const prodUri = 'mongodb+srv://daoanhtien232001_db_user:Tien230901@cluster0.1q69m5e.mongodb.net/?appName=Cluster0';

  try {
    await checkAndFix(devUri, 'DEV DATABASE');
  } catch (e) {
    console.error('Error dev:', e.message);
  }

  try {
    await checkAndFix(prodUri, 'PROD DATABASE');
  } catch (e) {
    console.error('Error prod:', e.message);
  }
}

run();

