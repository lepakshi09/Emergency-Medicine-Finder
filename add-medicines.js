require('dotenv').config();
const { MongoClient } = require('mongodb');

const catalog = {
  'Cardiac': ['Metoprolol','Carvedilol','Bisoprolol','Ramipril','Enalapril','Nifedipine','Diltiazem','Furosemide','Spironolactone','Hydrochlorothiazide','Rosuvastatin','Nitroglycerin Sublingual Tablet','Digoxin','Warfarin'],
  'Diabetes': ['Gliclazide','Glipizide','Pioglitazone','Sitagliptin','Vildagliptin','Dapagliflozin','Insulin Glargine','Insulin Regular','Insulin Premixed 30/70','Glucometer Test Strips'],
  'Thyroid': ['Levothyroxine','Carbimazole','Propylthiouracil'],
  'Emergency': ['Adrenaline Injection','Atropine Injection','Hydrocortisone Injection','Dexamethasone Injection','Naloxone Injection','Activated Charcoal','Dextrose 25% Injection','Normal Saline IV','Ringer Lactate IV'],
  'Snake Bite': ['Anti-Snake Venom (Polyvalent)'],
  'Animal Bite': ['Anti-Rabies Vaccine','Rabies Immunoglobulin','Tetanus Toxoid Injection'],
  'Poisoning': ['Pralidoxime Injection'],
  'Antibiotic': ['Amoxicillin-Clavulanate','Cefuroxime','Cefpodoxime','Ceftriaxone Injection','Levofloxacin','Ofloxacin','Clarithromycin','Cephalexin','Nitrofurantoin','Co-trimoxazole'],
  'Antifungal': ['Fluconazole','Clotrimazole Cream','Terbinafine'],
  'Antiviral': ['Acyclovir','Oseltamivir'],
  'Anti-parasitic': ['Albendazole','Ivermectin'],
  'Antimalarial': ['Artemether-Lumefantrine','Chloroquine'],
  'Fever / Cold / Cough': ['Paracetamol Syrup','Paracetamol 650','Ambroxol Syrup','Dextromethorphan Syrup','Levocetirizine','Cough Lozenges','Nasal Saline Drops'],
  'Pain Killer': ['Naproxen','Aceclofenac','Etoricoxib','Mefenamic Acid','Ketorolac','Diclofenac Gel','Thiocolchicoside'],
  'Gastro': ['Rabeprazole','Esomeprazole','Sucralfate','Dicyclomine','Lactulose','Bisacodyl','Racecadotril','Simethicone'],
  'Neuro': ['Levetiracetam','Phenytoin','Sodium Valproate','Carbamazepine','Betahistine'],
  'Respiratory': ['Ipratropium Inhaler','Formoterol-Budesonide Inhaler','Theophylline','Salbutamol Tablet'],
  'Allergy': ['Fexofenadine','Hydroxyzine','Calamine Lotion'],
  'Supplements': ['Iron Folic Acid','Vitamin B12','Vitamin D3','Calcium Tablets','Multivitamin','Folic Acid'],
  'First Aid': ['Hydrogen Peroxide','Adhesive Bandage','Crepe Bandage','Cotton Roll','Digital Thermometer','Surgical Gloves','Mupirocin Ointment'],
};

async function main() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  const col = client.db('medicinefinder').collection('medicines');

  let added = 0;
  for (const [category, names] of Object.entries(catalog)) {
    for (const name of names) {
      const r = await col.updateOne(
        { name },
        { $setOnInsert: { name, category } },
        { upsert: true }
      );
      if (r.upsertedCount) added++;
    }
  }
  console.log('New medicines added:', added);
  console.log('Total medicines now:', await col.countDocuments());
  await client.close();
}

main().catch((e) => console.error(e.message));