-- 为stories表添加audio_url字段
-- 用于存储故事对应的播客音频URL

ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 添加注释
COMMENT ON COLUMN stories.audio_url IS '故事对应的播客音频URL，由火山引擎TTS API生成';

