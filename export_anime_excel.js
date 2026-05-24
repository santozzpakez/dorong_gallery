const { createClient } = require('@supabase/supabase-js');
const xlsx = require('xlsx');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function exportAnimeDataHybrid() {
  console.log('Mengambil data dari Supabase...');
  let allProducts = [];
  let hasMore = true;
  let page = 0;
  const pageSize = 1000;

  // Fetch all anime products
  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', 'anime')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    if (data.length > 0) {
      allProducts = allProducts.concat(data);
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Total produk anime ditemukan: ${allProducts.length}`);

  // Process and group data by series (Sheet name)
  const groupedData = {};

  allProducts.forEach(product => {
    // Extract Series and Character
    let series = 'Unknown Series';
    let character = 'Unknown Character';
    
    if (product.subcategory) {
      const parts = product.subcategory.split(' - ');
      if (parts.length >= 2) {
        series = parts[0].trim();
        character = parts[1].trim();
      } else {
        series = product.subcategory.trim();
      }
    }

    let sheetName = series.substring(0, 31).replace(/[:/\\?*\[\]]/g, '');
    if (!sheetName) sheetName = 'Lainnya';

    let originalFileName = '';
    if (product.image_url) {
      const urlParts = product.image_url.split('/');
      originalFileName = urlParts[urlParts.length - 1];
    }

    const rowData = {
      'Nama Karakter': character,
      'Nama Produk': product.title,
      'Original File Name': decodeURIComponent(originalFileName)
    };

    if (!groupedData[sheetName]) {
      groupedData[sheetName] = [];
    }
    groupedData[sheetName].push(rowData);
  });

  // Create Excel Workbook
  const workbook = xlsx.utils.book_new();

  // Add sheets to workbook and apply AutoFilter to EACH sheet
  for (const [sheetName, data] of Object.entries(groupedData)) {
    const worksheet = xlsx.utils.json_to_sheet(data);
    
    const colWidths = [
      { wch: 25 }, // Nama Karakter
      { wch: 40 }, // Nama Produk
      { wch: 50 }  // Original File Name
    ];
    worksheet['!cols'] = colWidths;

    // Apply Filter to this sheet
    const range = xlsx.utils.decode_range(worksheet['!ref']);
    worksheet['!autofilter'] = { ref: xlsx.utils.encode_range(range) };

    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  // Save to file
  const fileName = 'Kategori_Anime_Terbaik.xlsx';
  xlsx.writeFile(workbook, fileName);
  console.log(`Berhasil mengekspor data ke file: ${fileName} dengan fitur Sheet per Series + Filter`);
}

exportAnimeDataHybrid();
