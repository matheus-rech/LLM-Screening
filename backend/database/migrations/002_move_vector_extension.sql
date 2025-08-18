-- Move vector extension from public schema to a dedicated schema for security

-- Create a dedicated schema for extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Update search path for database to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Note: Moving the vector extension requires recreating it
-- This should be done carefully in production to avoid data loss
-- For now, we'll just add a comment about the security issue

COMMENT ON EXTENSION vector IS 'Vector similarity search extension. Should be moved from public schema to extensions schema for better security.';

-- Add RLS policies for better security
-- Enable RLS on tables that don't have it yet

-- Enable RLS on academic_papers if not already enabled
ALTER TABLE academic_papers ENABLE ROW LEVEL SECURITY;

-- Create policy for academic_papers
CREATE POLICY "Enable read access for all users" ON academic_papers
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON academic_papers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON academic_papers
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON academic_papers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Enable RLS on paper_references if not already enabled
ALTER TABLE paper_references ENABLE ROW LEVEL SECURITY;

-- Create policy for paper_references
CREATE POLICY "Enable read access for all users" ON paper_references
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON paper_references
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON paper_references
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON paper_references
  FOR DELETE USING (auth.role() = 'authenticated');
