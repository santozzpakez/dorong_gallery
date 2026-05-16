-- Tabel untuk menyimpan daftar kontak WhatsApp admin
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- Policy: Semua orang bisa melihat (untuk checkout)
CREATE POLICY "Anyone can view whatsapp contacts" 
ON public.whatsapp_contacts FOR SELECT 
USING (true);

-- Policy: Hanya Superior Admin yang bisa mengelola
-- Catatan: Menggunakan subquery ke tabel site_admins untuk mengecek role
CREATE POLICY "Superior admins can manage whatsapp contacts" 
ON public.whatsapp_contacts FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.site_admins 
    WHERE site_admins.email = auth.jwt() ->> 'email' 
    AND site_admins.role = 'superior'
  )
);

-- Masukkan data awal (migrasi dari hardcoded)
INSERT INTO public.whatsapp_contacts (name, phone)
VALUES 
('Admin Utama', '491633949013'),
('Admin Kedua', '6285183050120')
ON CONFLICT (phone) DO NOTHING;
