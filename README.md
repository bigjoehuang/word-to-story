# 字成故事 - Word to Story

一个基于 Next.js 和 Supabase 的故事创作平台，用户可以输入1-3个字，AI会生成一个有趣且引人思考的故事。

## 功能特性

- ✅ 输入1-3个字生成故事（使用DeepSeek API）
- ✅ 浏览和探索所有故事
- ✅ 点赞功能
- ✅ 每日创作限制（5次/天）
- ✅ 文本划线功能（类似微信读书）
- ✅ 在划线上发布想法
- ✅ 故事配图生成（使用豆包大模型）
- ✅ 深色/浅色模式
- ✅ 无限滚动
- ✅ 响应式设计
- ✅ 动画效果

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **数据库**: Supabase (PostgreSQL)
- **AI模型**: DeepSeek (故事生成), 豆包大模型 (图片生成)
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React

## 环境变量配置

创建 `.env.local` 文件，参考 `env.example`：

```env
# Supabase Configuration
# 在 Supabase Dashboard > Settings > API 中获取
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
# Publishable (anon) key - 用于客户端，可以公开
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
# Secret (service_role) key - 用于服务端，必须保密
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key

# DeepSeek API Configuration
# 在 DeepSeek 控制台获取 API Key
DEEPSEEK_API_KEY=your_deepseek_api_key

# 豆包大模型 API Configuration (for image generation)
# 使用Bearer token认证
DOUBAO_API_KEY=your_doubao_api_key
# 图片生成模型的endpoint ID
DOUBAO_IMAGE_MODEL=your_doubao_image_model_endpoint_id
```

## 数据库设置

1. 在 Supabase Dashboard 中执行 `supabase/schema.sql` 创建所有表
2. 如果需要添加图片字段，执行 `supabase/migration_add_image_url.sql`
3. 如果需要使用 Supabase Storage 存储图片，需要创建 `story-images` bucket：
   - 进入 Supabase Dashboard > Storage
   - 创建新 bucket 命名为 `story-images`
   - 设置为公开访问（Public）

## 豆包API配置说明

1. 登录火山引擎控制台
2. 搜索"豆包多模态大模型"，完成企业实名认证并开通服务
3. 在"访问控制" > "密钥管理"中生成密钥对
4. 获取 `ACCESS_KEY`、`SECRET_KEY` 和 `ENDPOINT_ID`
5. 如果API返回401错误，可能需要实现火山引擎的签名认证（参考官方SDK）

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm start
```

## 项目结构

```
├── app/
│   ├── api/
│   │   ├── generate/          # 生成故事
│   │   ├── generate-image/    # 生成配图
│   │   ├── like/              # 点赞
│   │   ├── stories/           # 获取故事列表
│   │   ├── limit/             # 每日限制
│   │   ├── highlights/        # 划线管理
│   │   └── thoughts/          # 想法管理
│   ├── explore/               # 探索页面
│   ├── page.tsx               # 主页面
│   └── layout.tsx             # 根布局
├── components/
│   ├── StoryCard.tsx          # 故事卡片
│   ├── HighlightableText.tsx   # 可划线文本
│   ├── ThoughtInput.tsx       # 想法输入
│   ├── GenerationProgress.tsx # 生成进度条
│   └── ...
├── lib/
│   ├── supabase.ts            # Supabase客户端
│   └── utils.ts               # 工具函数
└── supabase/
    └── schema.sql             # 数据库schema
```

## 功能说明

### 故事生成
- 用户输入1-3个字
- 调用DeepSeek API生成故事
- 记录生成时间用于进度估算
- 每日限制5次创作

### 划线功能
- 选择文本后可以添加下划线
- 点击划线可以发布想法
- 支持编辑和删除想法

### 配图生成
- 故事生成后，可以点击"生成配图"按钮
- 使用豆包大模型根据故事内容生成配图
- 图片保存到数据库或Supabase Storage

## 部署

### Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

### 数据库迁移

在Supabase Dashboard的SQL Editor中执行迁移文件。

## 许可证

MIT
