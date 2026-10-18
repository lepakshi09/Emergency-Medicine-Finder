require('dotenv').config();
const { MongoClient } = require('mongodb');

const medicines = [
  ['Paracetamol','Fever / Pain'],['Ibuprofen','Fever / Pain'],['Diclofenac','Fever / Pain'],
  ['Aspirin','Heart / Pain'],['Clopidogrel','Heart'],['Isosorbide Dinitrate','Heart'],
  ['Atorvastatin','Heart'],['Amlodipine','BP'],['Atenolol','BP'],['Telmisartan','BP'],['Losartan','BP'],
  ['Insulin','Diabetes'],['Metformin','Diabetes'],['Glimepiride','Diabetes'],['Glucose Powder','Diabetes'],
  ['Salbutamol Inhaler','Asthma'],['Budesonide Inhaler','Asthma'],['Montelukast','Asthma / Allergy'],
  ['Cetirizine','Allergy'],['Chlorpheniramine','Allergy'],['Loratadine','Allergy'],
  ['Prednisolone','Steroid'],['Hydrocortisone Cream','Skin'],
  ['ORS','Dehydration'],['Zinc Tablets','Diarrhoea'],['Loperamide','Diarrhoea'],
  ['Ondansetron','Vomiting'],['Domperidone','Vomiting'],['Pantoprazole','Acidity'],['Omeprazole','Acidity'],['Antacid Syrup','Acidity'],
  ['Amoxicillin','Antibiotic'],['Azithromycin','Antibiotic'],['Ciprofloxacin','Antibiotic'],
  ['Metronidazole','Antibiotic'],['Cefixime','Antibiotic'],['Doxycycline','Antibiotic'],
  ['Povidone Iodine','First Aid'],['Silver Sulfadiazine Cream','Burns'],['Bandage and Gauze','First Aid'],
];

const contacts = [
  { type: 'emergency', name: 'National Emergency Number', phone: '112', area: 'India' },
  { type: 'ambulance', name: 'Ambulance', phone: '108', area: 'India' },
  { type: 'ambulance', name: 'Patient Transport', phone: '102', area: 'India' },
];

const query = `
[out:json][timeout:60];
(
  node["amenity"="pharmacy"](17.55,83.0,17.95,83.5);
  way["amenity"="pharmacy"](17.55,83.0,17.95,83.5);
);
out center tags;
`;

async function importPharmacies(db) {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  const data = await res.json();
  let n = 0;
  for (const e of data.elements) {
    const lat = e.lat ?? e.center?.lat;
    const lng = e.lon ?? e.center?.lon;
    if (!lat || !lng) continue;
    const t = e.tags || {};
    const doc = {
      osmId: `${e.type}/${e.id}`,
      name: t.name || 'Unnamed Pharmacy',
      phone: t.phone || t['contact:phone'] || null,
      address: [t['addr:street'], t['addr:suburb'], t['addr:city']].filter(Boolean).join(', ') || null,
      location: { type: 'Point', coordinates: [lng, lat] },
      openingHoursRaw: t.opening_hours || null,
      is24x7: t.opening_hours === '24/7',
      source: 'osm',
    };
    await db.collection('pharmacies').updateOne({ osmId: doc.osmId }, { $set: doc }, { upsert: true });
    n++;
  }
  console.log('Pharmacies imported:', n);
}

async function seedMedicines(db) {
  for (const [name, category] of medicines) {
    await db.collection('medicines').updateOne({ name }, { $set: { name, category } }, { upsert: true });
  }
  console.log('Medicines seeded:', medicines.length);
}

async function seedContacts(db) {
  for (const c of contacts) {
    await db.collection('emergencyContacts').updateOne({ phone: c.phone }, { $set: c }, { upsert: true });
  }
  console.log('Emergency contacts seeded:', contacts.length);
}

async function createIndexes(db) {
  await db.collection('pharmacies').createIndex({ location: '2dsphere' });
  await db.collection('pharmacies').createIndex({ osmId: 1 }, { unique: true });
  await db.collection('medicines').createIndex({ name: 1 }, { unique: true });
  await db.collection('medicines').createIndex({ name: 'text' });
  await db.collection('inventory').createIndex({ pharmacyId: 1, medicineId: 1 }, { unique: true });
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  console.log('Indexes created');
}

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const db = client.db('medicinefinder');
  await createIndexes(db);
  await seedMedicines(db);
  await seedContacts(db);
  await importPharmacies(db);
  await client.close();
}

main().catch(console.error);