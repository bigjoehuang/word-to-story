# 测试环境设置指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

这将安装所有测试相关的依赖，包括：
- Jest 和相关工具
- React Testing Library
- Playwright

### 2. 运行测试

```bash
# 运行所有单元测试
npm test

# 运行 E2E 测试（需要先启动开发服务器）
npm run test:e2e

# 运行所有测试
npm run test:all
```

## 详细设置

### Jest 配置

Jest 配置文件位于 `jest.config.js`，主要配置包括：

- **测试环境**: `jest-environment-jsdom` (用于 React 组件测试)
- **路径映射**: `@/*` 映射到项目根目录
- **覆盖率阈值**: 50% (分支、函数、行、语句)

### Playwright 配置

Playwright 配置文件位于 `playwright.config.ts`，主要配置包括：

- **测试目录**: `./e2e`
- **浏览器**: Chromium, Firefox, WebKit
- **自动启动开发服务器**: 运行测试前自动启动 `npm run dev`

### 环境变量

创建 `.env.test` 文件用于测试环境变量：

```env
# 测试环境变量
NODE_ENV=test
DEEPSEEK_API_KEY=test-key
DOUBAO_API_KEY=test-key
SUPABASE_URL=test-url
SUPABASE_ANON_KEY=test-key
```

## 测试文件结构

```
__tests__/
├── api/              # API 路由测试
│   ├── generate.test.ts
│   └── highlights.test.ts
├── components/       # 组件测试
│   └── ThemeToggle.test.tsx
└── lib/              # 工具函数测试
    ├── utils.test.ts
    ├── xss-protection.test.ts
    ├── rate-limit.test.ts
    └── deviceId.test.ts

e2e/
├── home.spec.ts      # 首页 E2E 测试
└── explore.spec.ts   # 探索页 E2E 测试
```

## 常见问题

### 1. Jest 找不到模块

如果遇到模块解析问题，检查：
- `tsconfig.json` 中的路径配置
- `jest.config.js` 中的 `moduleNameMapper`

### 2. Playwright 浏览器未安装

首次运行 Playwright 测试时，需要安装浏览器：

```bash
npx playwright install
```

### 3. 测试超时

如果测试超时，可以增加超时时间：

在 `jest.config.js` 中：
```javascript
testTimeout: 10000 // 10 seconds
```

在 `playwright.config.ts` 中：
```typescript
use: {
  actionTimeout: 10000,
}
```

### 4. Mock 不工作

确保在测试文件顶部正确导入和配置 mock：

```typescript
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))
```

## CI/CD 集成

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
          cache: 'npm'
      
      - run: npm ci
      
      - run: npm test
        env:
          CI: true
      
      - run: npx playwright install --with-deps
      
      - run: npm run test:e2e
        env:
          CI: true
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 下一步

1. ✅ 基础测试框架已设置
2. ✅ 示例测试已创建
3. ⏳ 增加更多测试覆盖
4. ⏳ 集成到 CI/CD
5. ⏳ 性能测试
6. ⏳ 可访问性测试







