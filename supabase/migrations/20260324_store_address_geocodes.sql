-- PostgreSQL (Supabase only): pre-geocoded store addresses for map markers
-- For MySQL, use migrations/mysql/store_address_geocodes.sql instead
CREATE TABLE IF NOT EXISTS store_address_geocodes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  store_name TEXT,
  address_normalized TEXT NOT NULL UNIQUE,
  address_raw TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  geocode_source TEXT DEFAULT 'import',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_address_geocodes_user_id
  ON store_address_geocodes (user_id);

CREATE INDEX IF NOT EXISTS idx_store_address_geocodes_normalized
  ON store_address_geocodes (address_normalized);

ALTER TABLE store_address_geocodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read store geocodes for authenticated users"
  ON store_address_geocodes
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: allow anon read if your API route uses anon client without user session
CREATE POLICY "Allow read store geocodes for anon"
  ON store_address_geocodes
  FOR SELECT
  TO anon
  USING (true);
