const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestProduct() {
  console.log('Menyisipkan produk test ke Supabase...');
  const testProduct = {
    title: 'INI DIA DATANYA! BACA SAYA!',
    category: 'anime', 
    subcategory: 'Naruto - Test Character',
    price: 99999,
    stock: 99,
    image_url: 'https://example.com/ketemu.jpg',
    notes: 'Test webhook Make.com'
  };

  const { data, error } = await supabase
    .from('products')
    .insert([testProduct])
    .select();

  if (error) {
    console.error('Gagal memasukkan produk:', error.message);
  } else {
    console.log('Berhasil memasukkan produk! Webhook seharusnya terpicu sekarang.');
  }
}

insertTestProduct();
