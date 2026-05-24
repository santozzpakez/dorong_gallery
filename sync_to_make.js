const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/havcpgmw5dg7qv8lygq2dv6opfvyogyr';

function sendToMake(product) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      type: 'INSERT',
      table: 'products',
      record: product
    });

    const req = https.request(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function syncAll() {
  console.log('Mengambil semua produk dari database...');
  const { data: products, error } = await supabase.from('products').select('*');
  
  if (error) {
    console.error('Gagal mengambil produk:', error.message);
    return;
  }
  
  // Filter out any previous test products just in case
  const realProducts = products.filter(p => !p.title.startsWith('TEST '));
  
  console.log(`Ditemukan ${realProducts.length} produk asli. Memulai sinkronisasi ke Make.com...`);
  
  let successCount = 0;
  for (let i = 0; i < realProducts.length; i++) {
    const p = realProducts[i];
    try {
      await sendToMake(p);
      successCount++;
      console.log(`[${i+1}/${realProducts.length}] Terkirim: ${p.title} (${p.category})`);
    } catch (err) {
      console.error(`Gagal mengirim: ${p.title}`, err.message);
    }
    // Jeda setengah detik agar Make.com tidak kaget menerima ratusan data sekaligus
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`=================================`);
  console.log(`Sinkronisasi Selesai! Berhasil mengirim ${successCount} dari ${realProducts.length} produk.`);
}

syncAll();
