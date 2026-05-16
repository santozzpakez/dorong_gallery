const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://okgkghrlxsdkhzbpzlus.supabase.co';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // service role
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log("Testing upload...");
  // create dummy video file 100kb
  const dummyData = Buffer.alloc(100 * 1024, 'a');
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload('videos/test-video.mp4', dummyData, { contentType: 'video/mp4', upsert: true });

  if (error) console.error("Upload error:", error);
  else {
    console.log("Upload success:", data);
    // cleanup
    await supabase.storage.from('product-images').remove(['videos/test-video.mp4']);
  }
}
testUpload();
