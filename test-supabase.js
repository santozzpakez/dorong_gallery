const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envKeyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = envUrlMatch ? envUrlMatch[1].trim() : '';
const key = envKeyMatch ? envKeyMatch[1].trim() : '';

const supabase = createClient(url, key);

async function testSupabase() {
  console.log("Checking products table...");
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error("Products table error:", error.message);
  } else {
    console.log("Products table exists.");
  }
  
  console.log("Checking storage buckets...");
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  if (bucketError) {
    console.error("Bucket error:", bucketError.message);
  } else {
    console.log("Buckets:", buckets.map(b => b.name).join(', '));
  }
}

testSupabase();
