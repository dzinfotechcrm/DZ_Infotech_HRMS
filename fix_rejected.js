import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fixRejectedLeaves() {
  console.log("Restoring balances for previously rejected leaves...");
  
  const { data: employees } = await supabase.from('employees').select('*');
  for (const emp of employees) {
    if (emp.data) {
      const new_data = { ...emp.data };
      let updated = false;
      if (new_data.casual_leaves_used > 0) {
        new_data.casual_leaves_used = 0;
        updated = true;
      }
      if (new_data.paid_leaves_used > 0) {
        new_data.paid_leaves_used = 0;
        updated = true;
      }
      if (updated) {
        await supabase.from('employees').update({ data: new_data }).eq('id', emp.id);
        console.log(`Restored balance for ${emp.first_name || 'employee'}`);
      }
    }
  }
  console.log("Done!");
  process.exit(0);
}

fixRejectedLeaves();
