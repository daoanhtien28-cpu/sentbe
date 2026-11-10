const mongoose = require('mongoose');

const ALL_31_BANKS = [
  {
    code: 'SH',
    name: 'Suhyup Bank',
    shortName: 'Suhyup',
    binCode: '007',
    color: '#005596',
    imageUrl: 'assets/images/bank/suhyup_bank.png',
    order: 1,
    isActive: true,
  },
  {
    code: 'IBK',
    name: 'Industrial Bank of Korea',
    shortName: 'IBK',
    binCode: '003',
    color: '#1A4B9C',
    imageUrl: 'assets/images/bank/industrial_bank_of_korea.png',
    order: 2,
    isActive: true,
  },
  {
    code: 'KB',
    name: 'KB Kookmin Bank',
    shortName: 'KB',
    binCode: '004',
    color: '#796751',
    imageUrl: 'assets/images/bank/kb_kookmin_bank.png',
    order: 3,
    isActive: true,
  },
  {
    code: 'WOORI',
    name: 'Woori Bank',
    shortName: 'Woori',
    binCode: '020',
    color: '#0067AC',
    imageUrl: 'assets/images/bank/woori_bank.png',
    order: 4,
    isActive: true,
  },
  {
    code: 'SHINHAN',
    name: 'Shinhan Bank',
    shortName: 'Shinhan',
    binCode: '088',
    color: '#0046FF',
    imageUrl: 'assets/images/bank/shinhan_bank.png',
    order: 5,
    isActive: true,
  },
  {
    code: 'HANA',
    name: 'KEB Hana Bank',
    shortName: 'Hana Bank',
    binCode: '081',
    color: '#008485',
    imageUrl: 'assets/images/bank/hana_bank.png',
    order: 6,
    isActive: true,
  },
  {
    code: 'NH',
    name: 'Nonghyup Bank',
    shortName: 'NongHyup',
    binCode: '011',
    color: '#00A062',
    imageUrl: 'assets/images/bank/nonghyup_bank.png',
    order: 7,
    isActive: true,
  },
  {
    code: 'SC',
    name: 'Standard Chartered Korea',
    shortName: 'SC Bank',
    binCode: '023',
    color: '#00A3E0',
    imageUrl: 'assets/images/bank/standard_chartered_korea.png',
    order: 8,
    isActive: true,
  },
  {
    code: 'CITI',
    name: 'Citibank Korea',
    shortName: 'Citi Bank',
    binCode: '027',
    color: '#002D72',
    imageUrl: 'assets/images/bank/citibank_korea.png',
    order: 9,
    isActive: true,
  },
  {
    code: 'POST',
    name: 'Korea Post Bank',
    shortName: 'Korea Post',
    binCode: '071',
    color: '#ED1C24',
    imageUrl: 'assets/images/bank/korea_post_bank.png',
    order: 10,
    isActive: true,
  },
  {
    code: 'KYONGNAM',
    name: 'Kyongnam Bank',
    shortName: 'BNK Kyongnam Bank',
    binCode: '039',
    color: '#C51D24',
    imageUrl: 'assets/images/bank/kyongnam_bank.png',
    order: 11,
    isActive: true,
  },
  {
    code: 'KWANGJU',
    name: 'Kwangju Bank',
    shortName: 'Gwangju Bank',
    binCode: '034',
    color: '#003882',
    imageUrl: 'assets/images/bank/kwangju_bank.png',
    order: 12,
    isActive: true,
  },
  {
    code: 'DGB',
    name: 'Daegu Bank',
    shortName: 'iM Bank',
    binCode: '031',
    color: '#0077C8',
    imageUrl: 'assets/images/bank/daegu_bank.png',
    order: 13,
    isActive: true,
  },
  {
    code: 'DEUTSCHE',
    name: 'Deutsche Bank',
    shortName: 'Deutsche Bank',
    binCode: '055',
    color: '#0018A8',
    imageUrl: 'assets/images/bank/deutsche_bank.png',
    order: 14,
    isActive: true,
  },
  {
    code: 'BUSAN',
    name: 'Busan Bank',
    shortName: 'BNK Busan Bank',
    binCode: '032',
    color: '#E30613',
    imageUrl: 'assets/images/bank/busan_bank.png',
    order: 15,
    isActive: true,
  },
  {
    code: 'KMSFC',
    name: 'Forestry Cooperative',
    shortName: 'NFCF',
    binCode: '064',
    color: '#2E7D32',
    imageUrl: 'assets/images/bank/forestry_cooperative.png',
    order: 16,
    isActive: true,
  },
  {
    code: 'KDB',
    name: 'Korea Development Bank',
    shortName: 'KDB Bank',
    binCode: '002',
    color: '#0C4DA2',
    imageUrl: 'assets/images/bank/korea_development_bank.png',
    order: 17,
    isActive: true,
  },
  {
    code: 'SAVINGS',
    name: 'Savings Bank',
    shortName: 'Savings Bank',
    binCode: '050',
    color: '#E60012',
    imageUrl: 'assets/images/bank/savings_bank.png',
    order: 18,
    isActive: true,
  },
  {
    code: 'KFCC',
    name: 'Korea Federation of Community Credit Cooperatives',
    shortName: 'MG Community Credit',
    binCode: '045',
    color: '#005DAA',
    imageUrl: 'assets/images/bank/community_credit_cooperatives.png',
    order: 19,
    isActive: true,
  },
  {
    code: 'CU',
    name: 'Credit Union',
    shortName: 'Credit Union',
    binCode: '048',
    color: '#004380',
    imageUrl: 'assets/images/bank/credit_union.png',
    order: 20,
    isActive: true,
  },
  {
    code: 'JEONBUK',
    name: 'Jeonbuk Bank',
    shortName: 'JB Bank',
    binCode: '037',
    color: '#004B9B',
    imageUrl: 'assets/images/bank/jeonbuk_bank.png',
    order: 21,
    isActive: true,
  },
  {
    code: 'JEJU',
    name: 'Jeju Bank',
    shortName: 'Jeju Bank',
    binCode: '035',
    color: '#004B9B',
    imageUrl: 'assets/images/bank/jeju_bank.png',
    order: 22,
    isActive: true,
  },
  {
    code: 'BOA',
    name: 'Bank of America',
    shortName: 'Bank of America',
    binCode: '060',
    color: '#012169',
    imageUrl: 'assets/images/bank/bank_of_america.png',
    order: 23,
    isActive: true,
  },
  {
    code: 'JPMORGAN',
    name: 'JP Morgan Chase',
    shortName: 'JP Morgan',
    binCode: '057',
    color: '#117ACA',
    imageUrl: 'assets/images/bank/jp_morgan_chase.png',
    order: 24,
    isActive: true,
  },
  {
    code: 'ICBC',
    name: 'Industrial and Commercial Bank of China',
    shortName: 'ICBC',
    binCode: '062',
    color: '#C7152A',
    imageUrl: 'assets/images/bank/industrial_commercial_bank_of_china.png',
    order: 25,
    isActive: true,
  },
  {
    code: 'BNP',
    name: 'BNP Paribas South Korea',
    shortName: 'BNP Paribas',
    binCode: '061',
    color: '#00915A',
    imageUrl: 'assets/images/bank/bnp_paribas_south_korea.png',
    order: 26,
    isActive: true,
  },
  {
    code: 'CCB',
    name: 'China Construction Bank',
    shortName: 'CCB',
    binCode: '067',
    color: '#003B79',
    imageUrl: 'assets/images/bank/china_construction_bank.png',
    order: 27,
    isActive: true,
  },
  {
    code: 'KAKAO',
    name: 'Kakao Bank',
    shortName: 'Kakao Bank',
    binCode: '090',
    color: '#FEE500',
    imageUrl: 'assets/images/bank/kakao_bank.png',
    order: 28,
    isActive: true,
  },
  {
    code: 'KBANK',
    name: 'K Bank',
    shortName: 'K Bank',
    binCode: '089',
    color: '#00E676',
    imageUrl: 'assets/images/bank/k_bank.png',
    order: 29,
    isActive: true,
  },
  {
    code: 'TOSS',
    name: 'Toss Bank',
    shortName: 'Toss Bank',
    binCode: '092',
    color: '#0064FF',
    imageUrl: 'assets/images/bank/toss_bank.png',
    order: 30,
    isActive: true,
  },
  {
    code: 'LOCAL_TAX',
    name: 'Local Tax',
    shortName: 'Local Tax',
    binCode: '098',
    color: '#4A90E2',
    imageUrl: 'assets/images/bank/local_tax.png',
    order: 31,
    isActive: true,
  },
];

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://daoanhtien232001_db_user:emVFLDKp4dBkb4yE@cluster0.obcykjf.mongodb.net';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const collection = mongoose.connection.collection('banks');

  // Xóa bank SUHYUP cũ nếu còn tồn tại để tránh trùng lặp với SH
  await collection.deleteOne({ code: 'SUHYUP' });

  for (const bank of ALL_31_BANKS) {
    await collection.updateOne(
      { code: bank.code },
      {
        $set: {
          code: bank.code,
          name: bank.name,
          shortName: bank.shortName,
          binCode: bank.binCode,
          color: bank.color,
          imageUrl: bank.imageUrl,
          order: bank.order,
          isActive: bank.isActive,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  // Xóa toàn bộ các ngân hàng ngoài 31 ngân hàng hợp lệ
  const validCodes = ALL_31_BANKS.map((b) => b.code);
  const deleteRes = await collection.deleteMany({ code: { $nin: validCodes } });
  console.log(`Deleted ${deleteRes.deletedCount} excess banks from DB.`);

  const total = await collection.countDocuments();
  console.log(`Total banks in collection: ${total}`);

  const banks = await collection.find({}).sort({ order: 1 }).toArray();
  console.log('--- List of Banks in DB (Sorted by order) ---');
  banks.forEach((b) => {
    console.log(`[#${String(b.order).padStart(2, ' ')}] ${b.code.padEnd(10)} | ${b.name.padEnd(25)} | ${b.imageUrl}`);
  });

  await mongoose.disconnect();
  console.log('Finished successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

