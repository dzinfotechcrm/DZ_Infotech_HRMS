import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function reset() {
  console.log("Resetting paid_leaves_used to 0 for all employees...");
  
  const { data: employees } = await supabase.from('employees').select('*');
  for (const emp of employees) {
    if (emp.data && emp.data.paid_leaves_used > 0) {
      const new_data = { ...emp.data, paid_leaves_used: 0 };
      await supabase.from('employees').update({ data: new_data }).eq('id', emp.id);
      console.log(`Reset paid_leaves_used for ${emp.first_name || 'employee'}`);
    }
  }
  console.log("Done!");
  process.exit(0);
}

reset();
