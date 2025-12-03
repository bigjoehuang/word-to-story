-- Migration: Add profiles table for storing user nicknames
-- 使用 deviceId 作为匿名用户的主键 id

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY, -- 对应 deviceId
  nickname TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引：按昵称模糊搜索（可选）
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);

-- 启用 RLS（虽然服务端使用 service role 不受限制，但保持安全习惯）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 允许公开读取昵称（只暴露昵称，不暴露敏感信息）
CREATE POLICY "Allow public read profiles" ON profiles
  FOR SELECT
  USING (true);

-- 插入/更新通过服务端 service role 完成，普通客户端不直接写 profiles


-- 为 stories 表添加 author_nickname 列，用于存储创作人昵称
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS author_nickname TEXT;


