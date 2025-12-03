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

-- Create generation_times table for tracking generation duration
CREATE TABLE IF NOT EXISTS generation_times (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  duration_ms INTEGER NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generation_times_created_at ON generation_times(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generation_times_ip ON generation_times(ip_address);

-- Enable Row Level Security (RLS)
ALTER TABLE generation_times ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert generation times
CREATE POLICY "Allow public insert generation times" ON generation_times
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to read generation times
CREATE POLICY "Allow public read generation times" ON generation_times
  FOR SELECT
  USING (true);

