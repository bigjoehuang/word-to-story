-- 创建 API 速率限制表
-- 用于记录和限制 API 请求频率

CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- 客户端标识符（device:xxx 或 ip:xxx）
  endpoint TEXT, -- API 端点（可选）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier_created 
  ON api_rate_limits(identifier, created_at);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_created 
  ON api_rate_limits(created_at);

-- 创建清理过期记录的函数（可选，用于定期清理）
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- 删除 24 小时前的记录
  DELETE FROM api_rate_limits
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- 添加注释
COMMENT ON TABLE api_rate_limits IS 'API 速率限制记录表，用于防止 API 滥用';
COMMENT ON COLUMN api_rate_limits.identifier IS '客户端标识符，格式：device:xxx 或 ip:xxx';
COMMENT ON COLUMN api_rate_limits.endpoint IS 'API 端点路径（可选）';

