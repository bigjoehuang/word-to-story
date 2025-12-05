-- Add character_name column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS character_name TEXT;

-- Create index for character_name queries (optional, for filtering stories by character)
CREATE INDEX IF NOT EXISTS idx_stories_character_name ON stories(character_name) WHERE character_name IS NOT NULL;

