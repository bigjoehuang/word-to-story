# 测试修复总结

## 问题说明

### 核心问题
Next.js 的 `next/jest` 在配置加载时就会导入 Next.js 的 server 模块，这些模块需要 `Request` API，但 Jest 的 jsdom 环境不提供这个 API。

### 错误信息
```
ReferenceError: Request is not defined
at Object.<anonymous> (/Users/hjoe/ai-creation/word-to-story/node_modules/next/dist/server/web/spec-extension/request.js:28:27)
```

## 已实施的解决方案

### 1. ✅ 创建了集成测试（使用真实 API）
- `__tests__/api/generate.integration.test.ts`
- `__tests__/api/highlights.integration.test.ts`

这些测试使用真实的 API 和数据库，不依赖 Mock。

### 2. ✅ 创建了测试策略文档
- `TESTING_STRATEGY.md` - 详细说明 Mock vs 真实 API 的使用场景

### 3. ✅ 更新了 package.json
添加了测试脚本：
- `test:unit` - 只运行单元测试
- `test:integration` - 运行集成测试
- `test:all` - 运行所有测试

## 推荐的解决方案

### 方案 1: 升级 Node.js（最佳）
Node.js 18+ 内置了 `Request` 和 `Response` API。

```bash
# 升级到 Node.js 18+
nvm install 18
nvm use 18

# 然后运行测试
npm test
```

### 方案 2: 使用集成测试（当前可用）
集成测试使用真实的 API，不依赖 Mock：

```bash
# 设置环境变量
export RUN_INTEGRATION_TESTS=true
export SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-key
export DEEPSEEK_API_KEY=your-key

# 运行集成测试
npm test -- integration.test.ts
```

### 方案 3: 使用 E2E 测试
对于 API 路由，使用 Playwright E2E 测试：

```bash
npm run test:e2e
```

## 当前可运行的测试

### ✅ 可以运行
- 工具函数测试（`__tests__/lib/utils.test.ts`）
- XSS 防护测试（`__tests__/lib/xss-protection.test.ts`）
- 设备ID测试（`__tests__/lib/deviceId.test.ts`）
- 组件测试（`__tests__/components/ThemeToggle.test.tsx`）
- E2E 测试（`e2e/*.spec.ts`）

### ⚠️ 需要 Node.js 18+ 或使用集成测试
- API 路由单元测试（`__tests__/api/*.test.ts`）

## 关于 Mock vs 真实 API 的说明

### 为什么需要 Mock？
1. **速度**: 单元测试运行在毫秒级，可以频繁运行
2. **隔离**: 不依赖外部服务，测试更稳定
3. **成本**: 不消耗 API 配额，不产生费用
4. **可控**: 可以测试各种错误场景

### 为什么也需要真实 API？
1. **验证**: 确保整个系统正常工作
2. **集成**: 测试真实的数据流和数据库交互
3. **发布前**: 最终验证关键流程

### 我们的策略
- **单元测试（Mock）**: 80% - 快速、频繁运行
- **集成测试（真实 API）**: 20% - 关键流程验证
- **E2E 测试**: 完整用户流程

## 下一步行动

1. **短期**: 使用集成测试验证 API 功能
2. **中期**: 升级 Node.js 到 18+ 以支持 API 单元测试
3. **长期**: 建立完整的测试体系（单元 + 集成 + E2E）

## 文件说明

- `TESTING_STRATEGY.md` - Mock vs 真实 API 的详细说明
- `TEST_STATUS.md` - 当前测试状态
- `TEST_SETUP.md` - 测试环境设置指南
- `TESTING.md` - 完整的测试文档




