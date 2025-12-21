import { createClient } from '@supabase/supabase-js';

// I added the https:// prefix that was missing
const supabaseUrl = 'https://lurcsggtjmhwsukxkkho.supabase.co';

// I inserted your ANON key (the first one). 
// Do NOT change this to the other key.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1cmNzZ2d0am1od3N1a3hra2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjY3MTEsImV4cCI6MjA3OTM0MjcxMX0.j11a9eH00GiXr8gS-gOfzFA8I5akijXwVUfAbYP7mRc';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
