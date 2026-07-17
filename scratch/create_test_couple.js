import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://btijpjibghnmqalmbwsv.supabase.co', 'sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB');

async function main() {
  console.log("Creating test couple...");
  
  const emailA = `test_partner_a_${Date.now()}@example.com`;
  const emailB = `test_partner_b_${Date.now()}@example.com`;
  const password = 'password123';

  console.log(`Signing up User A: ${emailA}`);
  const { data: dataA, error: errA } = await supabase.auth.signUp({
    email: emailA,
    password: password
  });

  if (errA) {
    console.error("User A signup failed:", errA);
    return;
  }
  const userA = dataA.user;
  console.log(`User A created: ${userA.id}`);

  console.log(`Signing up User B: ${emailB}`);
  const { data: dataB, error: errB } = await supabase.auth.signUp({
    email: emailB,
    password: password
  });

  if (errB) {
    console.error("User B signup failed:", errB);
    return;
  }
  const userB = dataB.user;
  console.log(`User B created: ${userB.id}`);

  // Wait 2 seconds for triggers to run (though we have client-side fallbacks, we can create profiles directly to be sure)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Let's ensure they have profile rows
  console.log("Ensuring profiles exist...");
  await supabase.from('profiles').insert([
    { id: userA.id, email: emailA, display_name: 'Test Partner A' },
    { id: userB.id, email: emailB, display_name: 'Test Partner B' }
  ]).select();

  // Create a couple
  console.log("Creating couple row...");
  const { data: couple, error: coupleErr } = await supabase.from('couples').insert([
    { flame_xp: 15, flame_energy: 80 }
  ]).select().single();

  if (coupleErr) {
    console.error("Couple creation failed:", coupleErr);
    return;
  }
  console.log(`Couple created with ID: ${couple.id}`);

  // Link both profiles to this couple
  console.log("Linking profiles to couple...");
  const { error: linkErr } = await supabase.from('profiles')
    .update({ couple_id: couple.id })
    .in('id', [userA.id, userB.id]);

  if (linkErr) {
    console.error("Linking profiles failed:", linkErr);
    return;
  }

  console.log("SUCCESS! Test couple is fully set up and linked!");
  console.log("Login credentials:");
  console.log(`Partner A Email: ${emailA}`);
  console.log(`Partner B Email: ${emailB}`);
  console.log(`Password: ${password}`);
}

main();
