const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envUrlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const envServiceKeyMatch = envFile.match(/SUPABASE_SERVICE_KEY=(.*)/);

const url = envUrlMatch ? envUrlMatch[1].trim() : '';
const serviceKey = envServiceKeyMatch ? envServiceKeyMatch[1].trim() : '';

const supabase = createClient(url, serviceKey);

async function setupBucket() {
  console.log("Checking buckets...");
  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  
  if (getError) {
    console.error("Error fetching buckets:", getError.message);
    return;
  }
  
  const hasProductBucket = buckets.some(b => b.name === 'product-images');
  
  if (!hasProductBucket) {
    console.log("Bucket 'product-images' not found. Creating...");
    const { data, error } = await supabase.storage.createBucket('product-images', {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (error) {
      console.error("Failed to create bucket:", error.message);
    } else {
      console.log("Bucket 'product-images' created successfully!");
    }
  } else {
    console.log("Bucket 'product-images' already exists.");
    // Ensure it's public
    const { error } = await supabase.storage.updateBucket('product-images', {
      public: true
    });
    if (error) {
       console.log("Failed to update bucket visibility:", error.message);
    } else {
       console.log("Bucket visibility set to public.");
    }
  }
}

setupBucket();
