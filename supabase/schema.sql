-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  words TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_ip_date ON stories(ip_address, created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read stories
CREATE POLICY "Allow public read access" ON stories
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert stories
CREATE POLICY "Allow public insert" ON stories
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update likes
CREATE POLICY "Allow public update likes" ON stories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

