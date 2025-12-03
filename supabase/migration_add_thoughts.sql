-- Migration: Add thoughts table for storing thoughts/notes on highlights
-- Execute this in Supabase SQL Editor

-- Create thoughts table for storing thoughts/notes on highlights
CREATE TABLE IF NOT EXISTS thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_thoughts_highlight_id ON thoughts(highlight_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_story_id ON thoughts(story_id);
CREATE INDEX IF NOT EXISTS idx_thoughts_ip ON thoughts(ip_address);

-- Enable Row Level Security (RLS)
ALTER TABLE thoughts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert thoughts
CREATE POLICY "Allow public insert thoughts" ON thoughts
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to read thoughts
CREATE POLICY "Allow public read thoughts" ON thoughts
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to update thoughts
CREATE POLICY "Allow public update thoughts" ON thoughts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow anyone to delete thoughts
CREATE POLICY "Allow public delete thoughts" ON thoughts
  FOR DELETE
  USING (true);

