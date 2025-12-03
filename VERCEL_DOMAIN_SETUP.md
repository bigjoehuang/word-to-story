# Vercel 域名配置指南（中国用户）

由于 Vercel 控制台在中国可能无法直接访问，以下是几种解决方案：

## 方案一：使用 Vercel CLI（推荐）

### 1. 安装 Vercel CLI（如果还没安装）
```bash
npm i -g vercel
```

### 2. 登录 Vercel
```bash
vercel login
```

### 3. 查看当前项目
```bash
vercel ls
```

### 4. 添加自定义域名
```bash
# 添加域名到项目
vercel domains add your-domain.com

# 或者指定项目
vercel domains add your-domain.com --scope bigjoes-projects
```

### 5. 查看域名配置
```bash
vercel domains ls
```

### 6. 查看域名 DNS 配置信息
```bash
vercel domains inspect your-domain.com
```

## 方案二：使用 VPN/代理访问 Vercel 控制台

1. 使用 VPN 或代理服务
2. 访问 https://vercel.com
3. 进入项目设置 > Domains
4. 添加自定义域名

## 方案三：使用国内部署平台

如果 Vercel 访问困难，可以考虑：

### 1. 腾讯云开发 CloudBase
- 支持 Next.js
- 国内访问速度快
- 有免费额度

### 2. 阿里云函数计算
- 支持 Serverless 部署
- 国内访问稳定

### 3. 华为云
- 支持静态网站托管
- 国内访问优化

## 方案四：使用 Vercel 的 API

如果 CLI 也不可用，可以使用 Vercel API：

```bash
# 获取 API Token（需要在能访问 Vercel 控制台时获取）
# 在 Vercel Settings > Tokens 中创建

# 使用 curl 添加域名
curl -X POST "https://api.vercel.com/v9/projects/{project-id}/domains" \
  -H "Authorization: Bearer YOUR_VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "your-domain.com"
  }'
```

## DNS 配置

添加域名后，需要在你的域名服务商（如阿里云、腾讯云）配置 DNS：

### 如果使用 Vercel 的域名
- 类型：CNAME
- 记录值：`cname.vercel-dns.com`

### 如果使用自定义域名
1. 在 Vercel 添加域名后，会显示需要配置的 DNS 记录
2. 通常需要添加：
   - A 记录或 CNAME 记录
   - 指向 Vercel 提供的 IP 或域名

## 验证域名

```bash
# 使用 CLI 验证
vercel domains verify your-domain.com

# 或访问 Vercel 控制台（需要 VPN）
```

## 常见问题

### Q: CLI 命令执行失败？
A: 确保已登录：`vercel login`，并检查网络连接

### Q: 域名添加后无法访问？
A: 
1. 检查 DNS 配置是否正确
2. 等待 DNS 传播（通常需要几分钟到几小时）
3. 使用 `vercel domains inspect` 查看配置状态

### Q: 如何查看项目 ID？
A: 
```bash
vercel project ls
# 或
vercel inspect
```

## 推荐方案

对于中国用户，推荐：
1. **优先使用 Vercel CLI** - 最稳定可靠
2. **备选：VPN + 控制台** - 如果 CLI 不可用
3. **长期方案：考虑国内平台** - 如果 Vercel 长期访问困难

