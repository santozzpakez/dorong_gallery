const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkBucket() {
  const { data, error } = await supabase.storage.getBucket('product-images')
  if (error) {
    console.error('Error fetching bucket:', error)
  } else {
    console.log('Bucket details:', JSON.stringify(data, null, 2))
  }
}

checkBucket()
