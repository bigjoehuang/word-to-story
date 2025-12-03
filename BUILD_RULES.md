# 构建规则和最佳实践

## Next.js 构建要求

### 1. useSearchParams() 必须包裹在 Suspense 中

**规则**: 任何使用 `useSearchParams()` 的组件必须被 `<Suspense>` 边界包裹。

**原因**: Next.js 13+ 要求在服务器端渲染时，使用 `useSearchParams()` 的组件必须提供 Suspense 边界，以便正确处理客户端导航。

**修复方法**:
```tsx
// ❌ 错误示例
export default function Page() {
  const searchParams = useSearchParams()
  // ...
}

// ✅ 正确示例
function PageContent() {
  const searchParams = useSearchParams()
  // ...
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PageContent />
    </Suspense>
  )
}
```

**已修复的文件**:
- `app/read/page.tsx` - 已使用 Suspense 包裹

### 2. request.json() 只能调用一次

**规则**: 在 API 路由中，`request.json()` 只能被调用一次。

**原因**: 请求体流只能读取一次，多次调用会导致错误。

**修复方法**:
```tsx
// ❌ 错误示例
const { words } = await request.json()
const { deviceId } = await request.json() // 错误！

// ✅ 正确示例
const { words, deviceId } = await request.json()
```

**已修复的文件**:
- `app/api/highlights/route.ts` - 已修复重复调用
- `app/api/thoughts/route.ts` - 已修复重复调用

### 3. 环境变量检查

**规则**: 所有使用环境变量的 API 路由都应该有默认值。

**示例**:
```tsx
const dailyLimit = parseInt(process.env.DAILY_STORY_LIMIT || '5', 10)
```

### 4. 设备ID验证

**规则**: 所有需要设备ID的API都应该验证 deviceId 参数。

**示例**:
```tsx
if (!deviceId || typeof deviceId !== 'string') {
  return NextResponse.json(
    { error: '缺少设备ID' },
    { status: 400 }
  )
}
```

## 构建检查清单

在提交代码前，确保：

- [ ] 所有使用 `useSearchParams()` 的页面都有 Suspense 边界
- [ ] 所有 API 路由中的 `request.json()` 只调用一次
- [ ] 所有环境变量都有默认值
- [ ] 所有设备ID都经过验证
- [ ] TypeScript 编译无错误 (`npm run build`)
- [ ] ESLint 检查通过 (`npm run lint`)

## Node.js 版本要求

- **最低版本**: Node.js >= 20.9.0
- **推荐版本**: Node.js >= 20.x LTS

如果构建失败提示 Node.js 版本过低，请升级 Node.js 版本。

## 常见构建错误

### 1. useSearchParams() 未包裹在 Suspense 中
```
Error: useSearchParams() should be wrapped in a suspense boundary
```
**解决**: 将使用 `useSearchParams()` 的组件包裹在 `<Suspense>` 中。

### 2. request.json() 重复调用
```
Error: Body is already consumed
```
**解决**: 确保 `request.json()` 只调用一次，并在一次调用中获取所有需要的参数。

### 3. 环境变量未定义
```
Error: process.env.XXX is undefined
```
**解决**: 为环境变量提供默认值，或确保 `.env.local` 文件存在。

