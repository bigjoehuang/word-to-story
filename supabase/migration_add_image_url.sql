-- Add image_url column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for image_url queries (optional, for filtering stories with images)
CREATE INDEX IF NOT EXISTS idx_stories_image_url ON stories(image_url) WHERE image_url IS NOT NULL;







