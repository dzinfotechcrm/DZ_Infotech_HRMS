import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Load your service account key JSON file path here
const serviceAccountPath = './serviceAccountKey.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Error: Service account key file not found at ${serviceAccountPath}`);
  console.error('Please download it from Firebase Console (Project Settings -> Service Accounts) and place it in the project root.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Or Service Role Key for bypassing RLS

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const collectionsToMigrate = [
  'users',
  'employees',
  'departments',
  'leaveTypes',
  'holidays',
  'leaveRequests',
  'leaveBalance',
  'attendance',
  'payroll',
  'documents',
  'activities',
  'settings'
];

async function migrateCollection(collectionName) {
  console.log(`Migrating collection: ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`No documents found in ${collectionName}. Skipping.`);
    return;
  }

  const tableName = collectionName.replace(/([A-Z])/g, "_$1").toLowerCase();

  const rows = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Convert Firestore Timestamps to ISO strings
    for (const key in data) {
      if (data[key] && typeof data[key].toDate === 'function') {
        data[key] = data[key].toDate().toISOString();
      }
    }

    const row = { id: doc.id };
    
    // Most tables have a 'data' column except for a few specific ones
    if (!['users', 'leave_balance', 'settings'].includes(tableName)) {
      row.data = data;
    }

    if (tableName === 'users') {
      row.email = data.email || '';
      row.display_name = data.name || data.displayName || '';
      row.role = data.role || 'employee';
      row.employee_id = data.employeeId || null;
      row.metadata = data;
    } else if (tableName === 'employees') {
      row.email = data.email || '';
      row.uid = data.uid || null;
      row.role = data.role || 'employee';
      row.status = data.status || 'active';
    } else if (tableName === 'leave_balance') {
      row.employee_id = data.employeeId || doc.id;
      row.balances = data;
    } else if (tableName === 'settings') {
      row.key = doc.id;
      row.value = data;
    } else {
      // Map other common fields for tables that have them
      if (data.name) row.name = data.name;
      if (data.email) row.email = data.email;
      if (data.employeeId && tableName !== 'employees') row.employee_id = data.employeeId;
    }

    if (data.created_at) row.created_at = data.created_at;
    if (data.updated_at) row.updated_at = data.updated_at;

    rows.push(row);
  });

  console.log(`Found ${rows.length} documents in ${collectionName}. Inserting to Supabase...`);
  
  // Insert in batches of 100
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from(tableName)
      .upsert(batch, { onConflict: 'id' });
      
    if (error) {
      console.error(`Error inserting batch into ${tableName}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} into ${tableName}`);
    }
  }
}

async function runMigration() {
  console.log('Starting migration from Firebase to Supabase...');
  for (const collection of collectionsToMigrate) {
    await migrateCollection(collection);
  }
  console.log('Migration completed successfully!');
}

runMigration().catch(console.error);
