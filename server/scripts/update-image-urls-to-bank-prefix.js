const mongoose = require('mongoose');

const MAPPINGS = {
  'assets/images/bank/nh_bank.png': 'assets/images/bank/bank_nh.png',
  'assets/images/bank/kb_bank.png': 'assets/images/bank/bank_kb.png',
  'assets/images/bank/ibk_bank.png': 'assets/images/bank/bank_ibk.png',
  'assets/images/bank/kdb_bank.png': 'assets/images/bank/bank_kdb.png',
  'assets/images/bank/shinhan_bank.png': 'assets/images/bank/bank_shinhan.png',
  'assets/images/bank/woori_bank.png': 'assets/images/bank/bank_woori.png',
  'assets/images/bank/hana_bank.png': 'assets/images/bank/bank_hana.png',
  'assets/images/bank/citi_bank.png': 'assets/images/bank/bank_citi.png',
  'assets/images/bank/sc_bank.png': 'assets/images/bank/bank_sc.png',
  'assets/images/bank/kakao_bank.png': 'assets/images/bank/bank_kakao.png',
  'assets/images/bank/k_bank.png': 'assets/images/bank/bank_kbank.png',
  'assets/images/bank/toss_bank.png': 'assets/images/bank/bank_toss.png',
  'assets/images/bank/bnk_kyongnam_bank.png': 'assets/images/bank/bank_gyeongnam.png',
  'assets/images/bank/gwangju_bank.png': 'assets/images/bank/bank_gwangju.png',
  'assets/images/bank/im_bank.png': 'assets/images/bank/bank_dgb.png',
  'assets/images/bank/bnk_busan_bank.png': 'assets/images/bank/bank_busan.png',
  'assets/images/bank/jb_bank.png': 'assets/images/bank/bank_jeonbuk.png',
  'assets/images/bank/suhyup_bank.png': 'assets/images/bank/bank_suhyup.png',
  'assets/images/bank/jeju_bank.png': 'assets/images/bank/bank_jeju.png',
  'assets/images/bank/nfcf.png': 'assets/images/bank/bank_sanlim.png',
  'assets/images/bank/national_credit_union.png': 'assets/images/bank/bank_cu.png',
  'assets/images/bank/mg_community_credit.png': 'assets/images/bank/bank_kfcc.png',
  'assets/images/bank/korea_post.png': 'assets/images/bank/bank_post.png',
  'assets/images/bank/savings_bank.png': 'assets/images/bank/bank_savings.png',
  'assets/images/bank/deutsche_bank.png': 'assets/images/bank/bank_deutsche.png',
  'assets/images/bank/bank_of_america.png': 'assets/images/bank/bank_boa.png',
  'assets/images/bank/bank_of_china.png': 'assets/images/bank/bank_boc.png',
  'assets/images/bank/cc_bank.png': 'assets/images/bank/bank_ccb.png',
  'assets/images/bank/bnp_paribas.png': 'assets/images/bank/bank_bnp.png',
  'assets/images/bank/jpmorgan_chase_bank.png': 'assets/images/bank/bank_jpmorgan.png',
  'assets/images/bank/수협.png': 'assets/images/bank/bank_suhyup.png',
  'assets/images/bank/국민은행.png': 'assets/images/bank/bank_kb.png',
  'assets/images/bank/신한은행.png': 'assets/images/bank/bank_shinhan.png',
};

const BANK_CODE_TO_IMAGE = {
  'NH': 'assets/images/bank/bank_nh.png',
  'KB': 'assets/images/bank/bank_kb.png',
  'IBK': 'assets/images/bank/bank_ibk.png',
  'KDB': 'assets/images/bank/bank_kdb.png',
  'SHINHAN': 'assets/images/bank/bank_shinhan.png',
  'WOORI': 'assets/images/bank/bank_woori.png',
  'HANA': 'assets/images/bank/bank_hana.png',
  'CITI': 'assets/images/bank/bank_citi.png',
  'SC': 'assets/images/bank/bank_sc.png',
  'KAKAO': 'assets/images/bank/bank_kakao.png',
  'KBANK': 'assets/images/bank/bank_kbank.png',
  'TOSS': 'assets/images/bank/bank_toss.png',
  'KYONGNAM': 'assets/images/bank/bank_gyeongnam.png',
  'KWANGJU': 'assets/images/bank/bank_gwangju.png',
  'DGB': 'assets/images/bank/bank_dgb.png',
  'BUSAN': 'assets/images/bank/bank_busan.png',
  'JEONBUK': 'assets/images/bank/bank_jeonbuk.png',
  'SH': 'assets/images/bank/bank_suhyup.png',
  'SUHYUP': 'assets/images/bank/bank_suhyup.png',
  'JEJU': 'assets/images/bank/bank_jeju.png',
  'KMSFC': 'assets/images/bank/bank_sanlim.png',
  'CU': 'assets/images/bank/bank_cu.png',
  'KFCC': 'assets/images/bank/bank_kfcc.png',
};

async function migrateDb(uri, label) {
  console.log(`\n=================== Migrating ${label} ===================`);
  await mongoose.connect(uri);
  const db = mongoose.connection;

  // 1. Update Banks
  const banksCol = db.collection('banks');
  for (const [code, newImg] of Object.entries(BANK_CODE_TO_IMAGE)) {
    await banksCol.updateMany(
      { code: code },
      { $set: { imageUrl: newImg, updatedAt: new Date() } }
    );
  }
  for (const [oldImg, newImg] of Object.entries(MAPPINGS)) {
    await banksCol.updateMany(
      { imageUrl: oldImg },
      { $set: { imageUrl: newImg, updatedAt: new Date() } }
    );
  }
  console.log('✅ Banks collection updated.');

  // 2. Update Wallets
  const walletsCol = db.collection('wallets');
  for (const [oldImg, newImg] of Object.entries(MAPPINGS)) {
    const res = await walletsCol.updateMany(
      { imageUrl: oldImg },
      { $set: { imageUrl: newImg, updatedAt: new Date() } }
    );
    if (res.modifiedCount > 0) {
      console.log(`Wallets: ${oldImg} -> ${newImg} (${res.modifiedCount} modified)`);
    }
  }
  // Also sync wallet imageUrl from linkedBankCode if needed
  for (const [code, newImg] of Object.entries(BANK_CODE_TO_IMAGE)) {
    await walletsCol.updateMany(
      { linkedBankCode: code, imageUrl: { $nin: Object.values(BANK_CODE_TO_IMAGE) } },
      { $set: { imageUrl: newImg, updatedAt: new Date() } }
    );
  }
  console.log('✅ Wallets collection updated.');

  // 3. Update Transactions
  const txCol = db.collection('transactions');
  const allTxs = await txCol.find({}).toArray();
  let modifiedTxCount = 0;
  for (const tx of allTxs) {
    let changed = false;
    let paymentBank = tx.paymentBank ? { ...tx.paymentBank } : null;
    let beneficiaryBank = tx.beneficiaryBank ? { ...tx.beneficiaryBank } : null;

    if (paymentBank) {
      if (MAPPINGS[paymentBank.imageUrl]) {
        paymentBank.imageUrl = MAPPINGS[paymentBank.imageUrl];
        changed = true;
      } else if (BANK_CODE_TO_IMAGE[paymentBank.bankCode] && paymentBank.imageUrl !== BANK_CODE_TO_IMAGE[paymentBank.bankCode]) {
        paymentBank.imageUrl = BANK_CODE_TO_IMAGE[paymentBank.bankCode];
        changed = true;
      }
    }

    if (beneficiaryBank) {
      if (MAPPINGS[beneficiaryBank.imageUrl]) {
        beneficiaryBank.imageUrl = MAPPINGS[beneficiaryBank.imageUrl];
        changed = true;
      } else if (BANK_CODE_TO_IMAGE[beneficiaryBank.bankCode] && beneficiaryBank.imageUrl !== BANK_CODE_TO_IMAGE[beneficiaryBank.bankCode]) {
        beneficiaryBank.imageUrl = BANK_CODE_TO_IMAGE[beneficiaryBank.bankCode];
        changed = true;
      }
    }

    if (changed) {
      await txCol.updateOne(
        { _id: tx._id },
        { $set: { paymentBank, beneficiaryBank, updatedAt: new Date() } }
      );
      modifiedTxCount++;
    }
  }
  console.log(`✅ Transactions collection updated (${modifiedTxCount} modified).`);

  // 4. Update Recent Transactions
  try {
    const recentCol = db.collection('recenttransactions');
    for (const [oldImg, newImg] of Object.entries(MAPPINGS)) {
      await recentCol.updateMany(
        { imageUrl: oldImg },
        { $set: { imageUrl: newImg, updatedAt: new Date() } }
      );
    }
    for (const [code, newImg] of Object.entries(BANK_CODE_TO_IMAGE)) {
      await recentCol.updateMany(
        { bankCode: code, imageUrl: { $nin: Object.values(BANK_CODE_TO_IMAGE) } },
        { $set: { imageUrl: newImg, updatedAt: new Date() } }
      );
    }
    console.log('✅ Recent transactions collection updated.');
  } catch (err) {
    console.log('No recenttransactions collection or error:', err.message);
  }

  await mongoose.disconnect();
}

async function run() {
  const devUri = 'mongodb+srv://daoanhtien232001_db_user:emVFLDKp4dBkb4yE@cluster0.obcykjf.mongodb.net';
  const prodUri = 'mongodb+srv://daoanhtien232001_db_user:Tien230901@cluster0.1q69m5e.mongodb.net/?appName=Cluster0';

  try {
    await migrateDb(devUri, 'DEV DATABASE');
  } catch (e) {
    console.error('Error migrating dev db:', e.message);
  }

  try {
    await migrateDb(prodUri, 'PROD DATABASE');
  } catch (e) {
    console.error('Error migrating prod db:', e.message);
  }

  console.log('\nAll migrations completed successfully!');
  process.exit(0);
}

run();

