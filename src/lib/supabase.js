import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://btijpjibghnmqalmbwsv.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8dOe6ZKFoWb1GKuPKdI1Yw_Er10tJRB';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
