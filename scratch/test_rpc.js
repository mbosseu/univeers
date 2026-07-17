import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://btijpjibghnmqalmbwsv.supabase.co', 'sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB');

async function test() {
  console.log("Calling link_partners RPC with an invalid code...");
  const { data, error } = await supabase.rpc('link_partners', { invite_code: 'INVALID-CODE' });
  console.log("Result:", data);
  console.log("Error details:", error);
}

test();
