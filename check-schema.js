require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = require('fs').readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function checkColumns() {
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.log("Error:", error.message);
  } else if (data.length > 0) {
    console.log("Columns found in table:", Object.keys(data[0]));
  } else {
    console.log("Table is empty, trying to insert a dummy row to test schema...");
    const { error: insErr } = await supabase.from('products').insert({
      title: 'test', price: 0, category: 'test', image_url: 'test'
    });
    console.log("Insert result (should show missing columns if any):", insErr ? insErr.message : "Success");
  }
}

checkColumns();
