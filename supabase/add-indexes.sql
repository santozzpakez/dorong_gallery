-- SQL Migration: Add Indexes to Optimize Product Loading & Search
-- Run this in the Supabase Studio -> SQL Editor -> New Query -> Run.

-- 1. Create Index on category to speed up category queries
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 2. Create Index on subcategory to speed up series, member, character, and theme queries
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory);

-- 3. Create Index on created_at (descending) to optimize product sorting/ordering
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- 4. Create Index on site_assets (key) for fast lookups
-- Note: 'key' is already a Primary Key so it is automatically indexed, but we can verify it.
