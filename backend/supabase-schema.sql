-- Supabase SQL Schema for QuickMark PDF License Management
-- Run this in your Supabase SQL editor

-- Create licenses table
CREATE TABLE licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  stripe_session_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on license_key for faster lookups
CREATE INDEX idx_licenses_license_key ON licenses(license_key);

-- Create index on email for lookups
CREATE INDEX idx_licenses_email ON licenses(email);

-- Enable Row Level Security (RLS)
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can do everything" ON licenses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Create a function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Optional: Create a view for analytics (without sensitive data)
CREATE VIEW license_stats AS
SELECT
  COUNT(*) as total_licenses,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_licenses,
  DATE(created_at) as date,
  COUNT(*) as licenses_per_day
FROM licenses
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;
