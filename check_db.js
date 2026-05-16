const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error('Error fetching products:', error)
  } else {
    console.log('Last 15 products:')
    data.forEach(p => {
      console.log(`ID: ${p.id}, Title: ${p.title}, Category: ${p.category}, Subcategory: ${p.subcategory}`)
    })
  }
}

checkProducts()
