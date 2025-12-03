-- Migration: Replace ip_address with user_id
-- 将基于IP的限制改为基于设备UID的限制

-- 1. 添加 user_id 列到 stories 表
ALTER TABLE stories ADD COLUMN IF NOT EXISTS user_id TEXT;

-- 2. 将现有的 ip_address 数据迁移到 user_id（如果ip_address有值，使用它作为临时user_id）
UPDATE stories SET user_id = COALESCE(ip_address, 'unknown') WHERE user_id IS NULL;

-- 3. 创建 user_id 索引
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_date ON stories(user_id, created_at);

-- 4. 添加 user_id 列到 generation_times 表
ALTER TABLE generation_times ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE generation_times SET user_id = COALESCE(ip_address, 'unknown') WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_generation_times_user_id ON generation_times(user_id);

-- 5. 添加 user_id 列到 highlights 表
ALTER TABLE highlights ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE highlights SET user_id = COALESCE(ip_address, 'unknown') WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_highlights_user_id ON highlights(user_id);

-- 6. 添加 user_id 列到 thoughts 表
ALTER TABLE thoughts ADD COLUMN IF NOT EXISTS user_id TEXT;
UPDATE thoughts SET user_id = COALESCE(ip_address, 'unknown') WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_thoughts_user_id ON thoughts(user_id);

-- 注意：ip_address 列保留用于向后兼容，但新代码应使用 user_id

