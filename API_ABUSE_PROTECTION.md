# API 防滥用机制

## 概述

本文档描述了项目中实施的 API 防滥用机制，包括速率限制、请求大小限制和请求验证。

## 已实施的防护措施

### 1. 速率限制 (Rate Limiting)

#### 实现方式
- **工具函数**: `lib/rate-limit.ts`
- **存储方式**: 基于数据库（`api_rate_limits` 表）
- **标识符**: 基于设备ID或IP地址

#### 速率限制配置

| API 端点 | 时间窗口 | 最大请求数 | 说明 |
|---------|---------|-----------|------|
| `/api/generate` | 1 小时 | 10 次 | 生成故事（除了每日限制） |
| `/api/generate-image` | 1 小时 | 20 次 | 生成图片 |
| `/api/highlights` | 1 分钟 | 30 次 | 高亮操作 |
| `/api/thoughts` | 1 分钟 | 20 次 | 想法操作 |
| `/api/like` | 1 分钟 | 50 次 | 点赞操作 |
| 其他 API | 1 分钟 | 60 次 | 通用限制 |

#### 速率限制响应
当超过限制时，API 返回：
- **状态码**: `429 Too Many Requests`
- **响应头**:
  - `X-RateLimit-Limit`: 最大请求数
  - `X-RateLimit-Remaining`: 剩余请求数
  - `X-RateLimit-Reset`: 重置时间（ISO 8601）
  - `Retry-After`: 重试等待时间（秒）

### 2. 请求大小限制

#### 各端点限制

| API 端点 | 最大大小 | 说明 |
|---------|---------|------|
| `/api/generate` | 1 KB | 只有 words 参数 |
| `/api/generate-image` | 10 KB | 包含故事内容 |
| `/api/highlights` | 5 KB | 高亮文本 |
| `/api/thoughts` | 5 KB | 想法内容 |
| `/api/like` | 512 B | 只有 storyId |
| `/api/generation-time` | 512 B | 只有 duration |
| 其他 | 1 MB | 默认限制 |

#### 响应
当请求体过大时，返回：
- **状态码**: `413 Payload Too Large`
- **错误消息**: "请求体过大"

### 3. 请求验证

#### 输入验证
- 所有 API 都进行输入验证
- 使用 `validateDeviceId()` 验证设备ID
- 使用 `validateUUID()` 验证 UUID 格式
- 使用 XSS 防护清理用户输入

#### 顺序检查
速率限制检查在以下操作之前进行：
1. 输入验证
2. 数据库查询
3. 外部 API 调用

这样可以：
- 防止恶意请求消耗资源
- 减少数据库负载
- 保护外部 API 配额

## 数据库表结构

### `api_rate_limits` 表

```sql
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,  -- 客户端标识符（device:xxx 或 ip:xxx）
  endpoint TEXT,             -- API 端点（可选）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 索引
- `idx_api_rate_limits_identifier_created`: 用于快速查询特定标识符的请求
- `idx_api_rate_limits_created`: 用于清理过期记录

### 清理机制
- 自动清理 24 小时前的记录
- 在每次查询时异步清理过期记录

## 使用示例

### 在 API 路由中使用速率限制

```typescript
import { 
  getClientIdentifier, 
  checkRateLimitDB, 
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit
} from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // 1. 检查请求体大小
  const maxSize = getRequestSizeLimit('/api/your-endpoint')
  if (!checkRequestSize(request, maxSize)) {
    return createErrorResponse('请求体过大', 413)
  }

  const { deviceId } = await request.json()

  // 2. 速率限制检查
  const identifier = getClientIdentifier(request, deviceId)
  const rateLimitResult = await checkRateLimitDB(
    identifier,
    RATE_LIMIT_CONFIGS.YOUR_CONFIG
  )

  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult, '请求过于频繁，请稍后再试')
  }

  // 3. 继续处理请求...
}
```

## 已应用速率限制的 API

- ✅ `/api/generate` - 生成故事
- ✅ `/api/generate-image` - 生成图片
- ✅ `/api/highlights` (POST) - 创建高亮
- ✅ `/api/thoughts` (POST, PUT) - 创建/更新想法
- ✅ `/api/like` - 点赞

## 监控和日志

### 开发环境
- 速率限制触发时记录日志
- 显示剩余请求数和重置时间

### 生产环境
- 记录速率限制违规到数据库
- 可以查询 `api_rate_limits` 表分析使用模式

## 未来改进

### 1. Redis 集成
- 使用 Redis 替代数据库存储速率限制
- 提高性能和可扩展性
- 支持分布式部署

### 2. 更细粒度的限制
- 基于用户等级的差异化限制
- 基于 API 端点的动态限制
- 基于请求复杂度的限制

### 3. 监控和告警
- 实时监控 API 使用情况
- 异常流量告警
- 自动封禁恶意 IP/设备

### 4. 滑动窗口算法
- 实现更精确的滑动窗口速率限制
- 替代当前的固定窗口

### 5. 白名单机制
- 为可信用户/IP 设置白名单
- 绕过速率限制（但仍记录）

## 安全考虑

### 1. 设备ID 伪造
- 当前依赖客户端提供的设备ID
- 建议：添加设备指纹验证
- 建议：结合 IP 地址和设备ID

### 2. IP 地址伪造
- 使用 `X-Forwarded-For` 头（可能被伪造）
- 建议：在反向代理层验证真实 IP
- 建议：使用多个标识符组合

### 3. 分布式攻击
- 当前限制基于单个标识符
- 建议：实施全局速率限制
- 建议：使用机器学习检测异常模式

## 测试建议

### 测试用例
1. **正常使用**: 验证正常请求不受影响
2. **速率限制**: 快速发送请求，验证限制生效
3. **请求大小**: 发送超大请求体，验证被拒绝
4. **重置时间**: 等待重置时间后，验证限制解除
5. **不同设备**: 验证不同设备ID有独立限制

### 测试工具
- 使用 `curl` 或 `Postman` 发送请求
- 使用脚本批量发送请求测试限制
- 监控数据库中的 `api_rate_limits` 表

## 配置

### 环境变量
速率限制配置可以通过修改 `lib/rate-limit.ts` 中的 `RATE_LIMIT_CONFIGS` 调整。

### 数据库迁移
运行 `supabase/migration_add_rate_limits.sql` 创建速率限制表。

