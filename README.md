# 字成故事 - Word to Story

一个基于 Next.js、Supabase 和 DeepSeek AI 的故事生成应用。用户输入1-3个字，AI 会创作一个有趣又引人思考的故事，其他用户可以浏览并点赞。

## 功能特性

- ✨ 输入1-3个字，AI 自动生成故事
- 📖 浏览所有用户创作的故事
- ❤️ 为喜欢的故事点赞
- 🎨 现代化的 UI 设计
- 🚀 部署在 Vercel，快速访问

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **数据库**: Supabase (PostgreSQL)
- **AI 模型**: DeepSeek API
- **样式**: Tailwind CSS
- **部署**: Vercel

## 开始使用

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd word-to-story
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `env.example` 文件为 `.env.local`：

```bash
cp env.example .env.local
```

然后编辑 `.env.local`，填入你的配置信息：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_api_key
```

#### 获取 Supabase 配置

1. 访问 [Supabase](https://supabase.com) 并登录
2. 创建新项目或选择现有项目
3. 进入项目设置 → API
4. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### 获取 DeepSeek API Key

1. 访问 [DeepSeek](https://www.deepseek.com/) 并注册账号
2. 进入 API 管理页面
3. 创建 API Key
4. 将 API Key 填入 `DEEPSEEK_API_KEY`

### 4. 设置 Supabase 数据库

在 Supabase Dashboard 中，进入 SQL Editor，执行以下 SQL 创建表结构：

```sql
-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  words TEXT NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read stories
CREATE POLICY "Allow public read access" ON stories
  FOR SELECT
  USING (true);

-- Create policy to allow anyone to insert stories
CREATE POLICY "Allow public insert" ON stories
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow anyone to update likes
CREATE POLICY "Allow public update likes" ON stories
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

或者直接运行项目根目录下的 `supabase/schema.sql` 文件。

### 5. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署到 Vercel

### 使用 Vercel CLI

1. 安装 Vercel CLI（如果还没有安装）：
```bash
npm i -g vercel
```

2. 登录 Vercel：
```bash
vercel login
```

3. 在项目根目录部署：
```bash
vercel
```

4. 配置环境变量：
   - 访问 Vercel Dashboard
   - 进入项目设置 → Environment Variables
   - 添加所有环境变量（与 `.env.local` 中的相同）

5. 重新部署以应用环境变量：
```bash
vercel --prod
```

### 使用 Vercel Dashboard

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "New Project"
3. 导入你的 Git 仓库
4. 在环境变量设置中添加所有必要的环境变量
5. 点击 "Deploy"

## 项目结构

```
word-to-story/
├── app/
│   ├── api/
│   │   ├── generate/      # 故事生成 API
│   │   ├── like/          # 点赞 API
│   │   └── stories/       # 获取故事列表 API
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页
│   └── globals.css        # 全局样式
├── lib/
│   └── supabase.ts        # Supabase 客户端配置
├── supabase/
│   └── schema.sql         # 数据库表结构
├── env.example            # 环境变量示例
└── README.md              # 项目说明
```

## 注意事项

- 点赞功能使用 IP 地址防止重复点赞，这是一个简单的实现方式
- 生产环境建议使用更完善的用户认证系统
- DeepSeek API 有调用限制，请注意使用频率
- 确保 Supabase 的 RLS (Row Level Security) 策略已正确配置

## 许可证

MIT
