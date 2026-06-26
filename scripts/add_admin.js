import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdmin() {
  const adminData = {
    id: "EMP_" + Date.now(),
    email: "savanimiren7@gmail.com",
    first_name: "Miren",
    last_name: "Savani",
    role: "admin",
    status: "active"
  };

  console.log("Inserting admin into employees table...");
  const { data, error } = await supabase
    .from('employees')
    .insert([adminData]);

  if (error) {
    console.error("Error inserting admin:", error);
  } else {
    console.log("Successfully inserted admin into employees table.");
    console.log("They will be fully synced to the users table when they log in with Google.");
  }
}

addAdmin();
