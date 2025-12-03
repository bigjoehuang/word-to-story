# 测试文档

本项目使用 Jest + React Testing Library 进行单元测试和组件测试，使用 Playwright 进行 E2E 测试。

## 测试框架

### 单元测试和组件测试
- **Jest**: JavaScript 测试框架
- **React Testing Library**: React 组件测试工具
- **@testing-library/jest-dom**: Jest DOM 匹配器

### E2E 测试
- **Playwright**: 现代浏览器自动化测试框架

## 安装依赖

```bash
npm install
```

## 运行测试

### 单元测试和组件测试

```bash
# 运行所有测试
npm test

# 监视模式（自动重新运行）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### E2E 测试

```bash
# 运行 E2E 测试
npm run test:e2e

# 使用 UI 模式运行（推荐）
npm run test:e2e:ui

# 在 headed 模式下运行（显示浏览器）
npm run test:e2e:headed

# 运行所有测试（单元 + E2E）
npm run test:all
```

## 测试结构

```
word-to-story/
├── __tests__/              # 单元测试和组件测试
│   ├── api/                # API 路由测试
│   ├── components/         # 组件测试
│   └── lib/                # 工具函数测试
├── e2e/                    # E2E 测试
│   ├── home.spec.ts        # 首页测试
│   └── explore.spec.ts     # 探索页测试
├── jest.config.js          # Jest 配置
├── jest.setup.js           # Jest 设置文件
└── playwright.config.ts    # Playwright 配置
```

## 测试覆盖范围

### 已测试的功能

#### 工具函数 (`__tests__/lib/`)
- ✅ `formatDate()` - 日期格式化
- ✅ `isLiked()` - 点赞状态检查
- ✅ XSS 防护函数 - HTML 转义和清理

#### 组件 (`__tests__/components/`)
- ✅ `ThemeToggle` - 主题切换组件

#### API 路由 (`__tests__/api/`)
- ✅ `/api/generate` - 故事生成
- ✅ `/api/highlights` - 高亮操作

#### E2E 测试 (`e2e/`)
- ✅ 首页基本功能
- ✅ 主题切换
- ✅ 探索页面导航

## 编写测试

### 单元测试示例

```typescript
import { formatDate } from '@/lib/utils'

describe('formatDate', () => {
  it('should return "刚刚" for dates less than 1 minute ago', () => {
    const now = new Date()
    const date = new Date(now.getTime() - 30 * 1000)
    expect(formatDate(date.toISOString())).toBe('刚刚')
  })
})
```

### 组件测试示例

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /切换主题/i })
    expect(button).toBeInTheDocument()
  })
})
```

### API 路由测试示例

```typescript
import { POST } from '@/app/api/generate/route'
import { NextRequest } from 'next/server'

describe('POST /api/generate', () => {
  it('should return 400 for missing words', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-device' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### E2E 测试示例

```typescript
import { test, expect } from '@playwright/test'

test('should toggle theme', async ({ page }) => {
  await page.goto('/')
  const themeToggle = page.locator('button[aria-label*="切换主题"]')
  await themeToggle.click()
  // 验证主题已切换
})
```

## 测试最佳实践

### 1. 测试命名
- 使用描述性的测试名称
- 遵循 `should [expected behavior] when [condition]` 格式

### 2. 测试组织
- 使用 `describe` 块组织相关测试
- 使用 `beforeEach` 和 `afterEach` 设置和清理

### 3. 断言
- 使用具体的断言，避免过于宽泛的检查
- 使用 `@testing-library/jest-dom` 的匹配器

### 4. Mock 和 Stub
- Mock 外部依赖（API、数据库等）
- 使用 `jest.mock()` 模拟模块

### 5. 覆盖率目标
- 当前目标：50% 覆盖率
- 优先测试关键业务逻辑
- 逐步提高覆盖率

## 持续集成

### GitHub Actions 示例

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## 调试测试

### Jest 调试
```bash
# 运行特定测试文件
npm test -- __tests__/lib/utils.test.ts

# 运行匹配模式的测试
npm test -- --testNamePattern="formatDate"

# 详细输出
npm test -- --verbose
```

### Playwright 调试
```bash
# 使用 UI 模式（推荐）
npm run test:e2e:ui

# 使用 headed 模式
npm run test:e2e:headed

# 调试特定测试
npm run test:e2e -- --grep "should toggle theme"
```

## 常见问题

### 1. 测试环境变量
在 `jest.setup.js` 中设置测试环境变量，或使用 `.env.test` 文件。

### 2. 异步测试
使用 `async/await` 或 `waitFor` 处理异步操作。

### 3. 时间相关测试
使用 `jest.useFakeTimers()` 或 `Date.now()` mock 处理时间相关测试。

### 4. 路由测试
Mock Next.js 路由使用 `jest.mock('next/navigation')`。

## 下一步

- [ ] 增加更多组件测试
- [ ] 增加更多 API 路由测试
- [ ] 提高测试覆盖率
- [ ] 添加性能测试
- [ ] 添加可访问性测试
- [ ] 集成到 CI/CD 流程

