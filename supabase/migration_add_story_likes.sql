-- Migration: Add story_likes table for per-user likes

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





