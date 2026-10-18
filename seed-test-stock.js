require('dotenv').config();
const { MongoClient } = require('mongodb');

// Use the same env variable name as in your working import-pharmacies.js
const uri = process.env.MONGO_URI;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('medicinefinder');

  // To remove all test data later: node seed-test-stock.js clean
  if (process.argv[2] === 'clean') {
    const r = await db.collection('inventory').deleteMany({ source: 'test' });
    console.log('Test stock removed:', r.deletedCount);
    await client.close();
    return;
  }

  const medicines = await db.collection('medicines').find().toArray();
  const pharmacies = await db
    .collection('pharmacies')
    .find({ name: { $ne: 'Unnamed Pharmacy' } })
    .limit(40)
    .toArray();

  const ops = [];
  for (const p of pharmacies) {
    for (const m of medicines) {
      ops.push({
        updateOne: {
          filter: { pharmacyId: p._id, medicineId: m._id },
          update: {
            $set: {
              pharmacyId: p._id,
              medicineId: m._id,
              inStock: Math.random() < 0.6, // about 60% in stock
              lastUpdated: new Date(),
              source: 'test',
            },
          },
          upsert: true,
        },
      });
    }
  }

  const r = await db.collection('inventory').bulkWrite(ops);
  console.log('Test stock records:', ops.length, '| upserted:', r.upsertedCount);
  await client.close();
}

main().catch((e) => console.error(e.message));