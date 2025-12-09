-- Migration: Add highlights table for text highlighting/underlining
-- Execute this in Supabase SQL Editor

-- Create highlights table for text highlighting/underlining
CREATE TABLE IF NOT EXISTS highlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_highlights_story_id ON highlights(story_id);
CREATE INDEX IF NOT EXISTS idx_highlights_ip ON highlights(ip_address);

-- Enable Row Level Security (RLS)
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert highlights
CREATE POLICY "Allow public insert highlights" ON highlights
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to read highlights
CREATE POLICY "Allow public read highlights" ON highlights
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to delete highlights
CREATE POLICY "Allow public delete highlights" ON highlights
  FOR DELETE
  USING (true);







