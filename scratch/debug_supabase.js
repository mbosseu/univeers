import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://btijpjibghnmqalmbwsv.supabase.co';
const supabaseAnonKey = 'sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debug() {
  console.log("Checking connection to Supabase...");
  
  // Test 1: Fetch profiles
  console.log("\n--- Test 1: Fetching profiles ---");
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);
  
  if (pError) {
    console.error("Error fetching profiles:", pError);
  } else {
    console.log("Profiles fetch success! Row count:", profiles.length);
    console.log("Profiles:", profiles);
  }

  // Test 2: Fetch invitations
  console.log("\n--- Test 2: Fetching invitations ---");
  const { data: invites, error: iError } = await supabase
    .from('invitations')
    .select('*')
    .limit(5);
  
  if (iError) {
    console.error("Error fetching invitations:", iError);
  } else {
    console.log("Invitations fetch success! Row count:", invites.length);
    console.log("Invitations:", invites);
  }

  // Test 3: Sign up a temporary test user to check if triggers work
  console.log("\n--- Test 3: Attempting to sign up test user ---");
  const testEmail = `debug_user_${Math.floor(Math.random() * 1000000)}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123'
  });

  if (authError) {
    console.error("Error signing up test user:", authError);
  } else {
    console.log("Auth Signup success! User ID:", authData.user?.id);
    
    // Now let's check if the trigger created a profile row
    console.log("Checking if profile trigger created a row...");
    const { data: pCheck, error: pcError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();
      
    if (pcError) {
      console.error("Error checking created profile:", pcError);
    } else {
      console.log("Profile trigger check result:", pCheck);
    }
  }
}

debug();
