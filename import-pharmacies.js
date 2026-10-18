require('dotenv').config();
const { MongoClient } = require('mongodb');

const servers = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const query = `
[out:json][timeout:90];
(
  node["amenity"="pharmacy"](17.55,83.0,17.95,83.5);
  way["amenity"="pharmacy"](17.55,83.0,17.95,83.5);
);
out center tags;
`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOverpass() {
  for (let round = 1; round <= 3; round++) {
    for (const url of servers) {
      try {
        console.log(`Trying ${url} (round ${round})...`);
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'emergency-medicine-finder-student-project/1.0',
          },
          body: 'data=' + encodeURIComponent(query),
        });
        const text = await res.text();
        if (!res.ok || text.trim().startsWith('<')) {
          console.log('  Failed, status:', res.status);
          continue;
        }
        return JSON.parse(text);
      } catch (err) {
        console.log('  Error:', err.message);
      }
    }
    console.log('All servers busy, waiting 20 seconds...');
    await sleep(20000);
  }
  throw new Error('Overpass is busy. Try again in a few minutes.');
}

async function main() {
  const data = await fetchOverpass();
  console.log('Elements received:', data.elements.length);

  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const col = client.db('medicinefinder').collection('pharmacies');

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
    await col.updateOne({ osmId: doc.osmId }, { $set: doc }, { upsert: true });
    n++;
  }
  console.log('Pharmacies imported:', n);
  await client.close();
}

main().catch((e) => console.error(e.message));