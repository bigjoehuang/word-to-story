# 故障排除指南

## Supabase 404 错误

如果遇到 Supabase 404 错误，请按以下步骤检查：

### 1. 检查环境变量配置

确保 `.env.local` 文件存在且包含正确的配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# Publishable (anon) key - 在 Settings > API > Project API keys > anon public
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
# Secret (service_role) key - 在 Settings > API > Project API keys > service_role secret
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

**重要提示：**
- URL 必须以 `https://` 开头
- URL 格式应该是：`https://[project-ref].supabase.co`
- 不要包含路径，例如 `/rest/v1/` 等
- Publishable key 可以公开，用于客户端
- Secret key 必须保密，仅用于服务端

### 2. 验证 Supabase API Keys

在 Supabase Dashboard 中：
1. 进入 **Settings** → **API**
2. 找到 **Project URL**（项目 URL）
3. 找到 **Project API keys**：
   - **anon public** - 这是 Publishable key（用于客户端）
   - **service_role secret** - 这是 Secret key（用于服务端，必须保密）
4. 确保 URL 格式正确

**正确的 URL 示例：**
```
https://abcdefghijklmnop.supabase.co
```

**错误的 URL 示例：**
```
https://abcdefghijklmnop.supabase.co/rest/v1/
abcdefghijklmnop.supabase.co
http://abcdefghijklmnop.supabase.co
```

### 3. 检查项目状态

确保 Supabase 项目：
- ✅ 已创建并激活
- ✅ 没有暂停或删除
- ✅ 数据库已初始化

### 4. 运行测试

访问测试 API 获取详细错误信息：
```
http://localhost:3000/api/test-db
```

或者在命令行运行：
```bash
npm run test:db
```

### 5. 常见问题

#### 问题：URL 格式错误
**症状：** 404 错误
**解决：** 确保 URL 以 `https://` 开头，且不包含路径

#### 问题：环境变量未加载
**症状：** "Missing environment variable" 错误
**解决：** 
- 确保 `.env.local` 文件在项目根目录
- 重启开发服务器：`npm run dev`

#### 问题：项目不存在
**症状：** 404 错误
**解决：** 在 Supabase Dashboard 中检查项目是否存在

#### 问题：网络连接问题
**症状：** 超时或连接错误
**解决：** 检查网络连接，或尝试使用 VPN

### 6. 获取帮助

如果问题仍然存在，请提供以下信息：
- 错误消息的完整内容
- `.env.local` 中的 URL（隐藏敏感部分）
- 测试 API 的响应内容








