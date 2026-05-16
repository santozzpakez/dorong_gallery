const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://okgkghrlxsdkhzbpzlus.supabase.co';
const supabaseKey = 'sb_publishable_k0D4tMckU2096wryIp2xdw_CClk4oPJ'; // anon key from env
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking DB connection...");
  const start = Date.now();
  const { data, error } = await supabase.from('site_assets').select('key').limit(1);
  console.log("Time taken:", Date.now() - start, "ms");
  if (error) console.error("Error:", error);
  else console.log("Connected, data:", data);
}
check();
