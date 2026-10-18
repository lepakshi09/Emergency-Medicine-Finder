require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_URI;

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('medicinefinder');

  const results = await db.collection('inventory').aggregate([
    { $match: { inStock: true } },
    { $lookup: { from: 'medicines', localField: 'medicineId', foreignField: '_id', as: 'med' } },
    { $unwind: '$med' },
    { $match: { 'med.name': 'Paracetamol' } },
    { $lookup: { from: 'pharmacies', localField: 'pharmacyId', foreignField: '_id', as: 'shop' } },
    { $unwind: '$shop' },
    { $project: { _id: 0, medicine: '$med.name', pharmacy: '$shop.name', inStock: 1 } },
    { $limit: 5 },
  ]).toArray();

  console.log(results);
  await client.close();
}

main().catch((e) => console.error(e.message));