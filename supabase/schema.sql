-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  words TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  image_url TEXT,
  author_nickname TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_ip_date ON stories(ip_address, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_words ON stories(words);

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

-- Per-user likes table to ensure each device/user only likes a story once
CREATE TABLE IF NOT EXISTS story_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON story_likes(user_id);

ALTER TABLE story_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read story_likes" ON story_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert story_likes" ON story_likes
  FOR INSERT
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

-- Create policy to allow anyone to delete their own highlights (by IP)
CREATE POLICY "Allow public delete highlights" ON highlights
  FOR DELETE
  USING (true);

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

-- Profiles table for nicknames (匿名用户档案)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- 对应 deviceId
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read profiles" ON profiles
  FOR SELECT
  USING (true);

-- Table for per-user story generation locks to prevent concurrent generations
CREATE TABLE IF NOT EXISTS generation_locks (
  user_id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_locks_created_at 
  ON generation_locks(created_at);

