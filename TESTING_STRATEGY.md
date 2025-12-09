# 测试策略说明

## 为什么使用 Mock？

### 1. **单元测试 vs 集成测试**

#### 单元测试（使用 Mock）
- **目的**: 快速测试单个函数/组件的逻辑
- **速度**: 非常快（毫秒级）
- **隔离性**: 不依赖外部服务（数据库、API）
- **成本**: 免费，不需要真实 API 调用
- **稳定性**: 不受外部服务影响

**示例场景**:
```typescript
// 测试输入验证逻辑，不需要真实数据库
it('should return 400 for missing words', async () => {
  // Mock 数据库调用
  // 只测试验证逻辑
})
```

#### 集成测试（使用真实 API）
- **目的**: 测试整个系统的工作流程
- **速度**: 较慢（秒级，需要网络请求）
- **真实性**: 使用真实的数据库和 API
- **成本**: 可能产生费用（API 调用）
- **稳定性**: 受外部服务影响

**示例场景**:
```typescript
// 测试完整流程，使用真实数据库
it('should generate a story end-to-end', async () => {
  // 真实 API 调用
  // 真实数据库操作
})
```

### 2. **Mock 的好处**

#### ✅ 快速反馈
- 单元测试运行在毫秒级
- 开发时可以频繁运行
- CI/CD 中快速失败

#### ✅ 隔离性
- 不依赖外部服务
- 可以测试错误场景
- 可以测试边界情况

#### ✅ 成本控制
- 不消耗 API 配额
- 不产生费用
- 不依赖网络

#### ✅ 可重复性
- 结果一致
- 不受外部因素影响
- 可以测试特定场景

### 3. **真实 API 测试的挑战**

#### ❌ 速度慢
- 需要网络请求
- 需要数据库查询
- 测试套件运行时间长

#### ❌ 成本
- API 调用可能产生费用
- 需要测试环境配置
- 需要测试数据管理

#### ❌ 不稳定性
- 网络问题
- 服务不可用
- 数据状态变化

#### ❌ 难以测试错误场景
- 如何测试 API 失败？
- 如何测试数据库错误？
- 如何测试特定错误码？

## 最佳实践：混合策略

### 推荐方案

```
┌─────────────────────────────────────┐
│  单元测试 (Mock) - 80%              │
│  - 快速反馈                         │
│  - 测试业务逻辑                     │
│  - 测试错误处理                     │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│  集成测试 (真实 API) - 20%           │
│  - 关键流程验证                     │
│  - 端到端测试                       │
│  - 发布前验证                       │
└─────────────────────────────────────┘
```

### 我们的测试结构

```
__tests__/
├── api/
│   ├── generate.test.ts              # 单元测试（Mock）
│   ├── generate.integration.test.ts  # 集成测试（真实 API）
│   ├── highlights.test.ts            # 单元测试（Mock）
│   └── highlights.integration.test.ts # 集成测试（真实 API）
└── lib/
    └── utils.test.ts                 # 纯函数测试（无需 Mock）
```

## 如何运行不同类型的测试

### 1. 只运行单元测试（默认）

```bash
npm test
```

### 2. 运行集成测试（需要环境变量）

```bash
# 设置环境变量
export RUN_INTEGRATION_TESTS=true
export SUPABASE_URL=your-test-url
export SUPABASE_SERVICE_ROLE_KEY=your-key
export DEEPSEEK_API_KEY=your-key

# 运行集成测试
npm test -- integration.test.ts
```

### 3. 运行所有测试

```bash
npm run test:all
```

## 什么时候使用真实 API？

### ✅ 应该使用真实 API 的场景

1. **关键业务流程**
   - 用户注册/登录
   - 支付流程
   - 数据同步

2. **发布前验证**
   - 部署前完整测试
   - 回归测试
   - 性能测试

3. **API 契约测试**
   - 验证 API 响应格式
   - 验证数据库结构
   - 验证外部服务集成

### ❌ 不应该使用真实 API 的场景

1. **日常开发**
   - 频繁运行测试
   - 快速迭代
   - 调试代码

2. **错误场景测试**
   - 测试错误处理
   - 测试边界情况
   - 测试异常情况

3. **CI/CD 快速反馈**
   - 每次提交运行
   - 快速失败
   - 快速反馈

## 实际示例

### 单元测试（Mock）- 快速验证逻辑

```typescript
// 测试输入验证，不需要真实 API
it('should return 400 for missing words', async () => {
  // Mock 请求
  const request = createMockRequest({ deviceId: 'test' })
  
  // 只测试验证逻辑
  const response = await POST(request)
  expect(response.status).toBe(400)
})
```

### 集成测试（真实 API）- 验证完整流程

```typescript
// 测试完整流程，使用真实数据库
it('should generate a story end-to-end', async () => {
  // 真实请求
  const request = createRealRequest({
    words: '测试',
    deviceId: 'real-device-id'
  })
  
  // 真实 API 调用
  const response = await POST(request)
  
  // 验证真实结果
  expect(response.status).toBe(200)
  expect(data.story).toBeDefined()
  
  // 验证数据库中的记录
  const story = await getStoryFromDB(data.story.id)
  expect(story).toBeDefined()
})
```

## 总结

- **Mock 用于**: 快速、频繁的单元测试
- **真实 API 用于**: 关键流程的集成测试
- **最佳实践**: 80% Mock + 20% 真实 API
- **我们的方案**: 两种测试都提供，按需使用

## 下一步

1. ✅ 已创建集成测试示例
2. ⏳ 配置测试环境变量
3. ⏳ 设置测试数据库
4. ⏳ 添加 CI/CD 配置







