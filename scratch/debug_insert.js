import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://btijpjibghnmqalmbwsv.supabase.co', 'sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB');

async function test() {
  const userId = '13deac12-be14-430a-894b-d586f467cf18'; // the user created in debug_supabase.js
  console.log("Attempting direct insert into profiles...");
  
  const { data, error } = await supabase
    .from('profiles')
    .insert([{
      id: userId,
      email: 'debug_user_test@gmail.com',
      display_name: 'Debug User'
    }])
    .select();
    
  console.log("Result:", data);
  console.log("Error details:", error);
}

test();
