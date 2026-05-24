require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testUpsert() {
  console.log('Testing upsert to site_assets...')
  
  const typeStr = JSON.stringify({"kpop":["Newjeans","Seventeen"]})
  const charStr = JSON.stringify({"kpop":{"Newjeans":["Danielle","Minji"],"Seventeen":["Hoshi","Mingyu","Wonwoo"]}})
  
  const start = Date.now()
  const { data, error } = await supabase.from('site_assets').upsert([
    {
      key: 'global-category-options',
      text_value: typeStr,
      label: 'Global Category List Cache',
      category: 'system',
      updated_at: new Date().toISOString()
    },
    {
      key: 'global-character-options',
      text_value: charStr,
      label: 'Global Character List Cache',
      category: 'system',
      updated_at: new Date().toISOString()
    }
  ], { onConflict: 'key' }).select('*')
  
  console.log(`Time taken: ${Date.now() - start}ms`)

  if (error) {
    console.error('ERROR:', error)
  } else {
    console.log('SUCCESS:', data)
  }
}

testUpsert()
