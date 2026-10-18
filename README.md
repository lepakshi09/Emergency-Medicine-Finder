@"
# Database setup (MongoDB Atlas)

DB name: medicinefinder
Collections: pharmacies, medicines, inventory, users, emergencyContacts
Location format: GeoJSON [lng, lat]. 2dsphere index on pharmacies.location

## Setup
1. npm install
2. Copy .env.example to .env and add your connection string
3. node setup-db.js (indexes, medicines, contacts, OSM pharmacies)
4. node add-medicines.js (more medicines)
5. node seed-test-stock.js (TEST stock; clean with: node seed-test-stock.js clean)

Warning: do not run seed-test-stock.js after real stock is added. It overwrites stock.
"@ | Set-Content README.md
git add README.md
git commit -m "Add README"
git push
