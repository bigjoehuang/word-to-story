# 迁移指南：从IP限制改为设备UID限制

## 概述

本次更新将基于IP地址的限制改为基于设备UID（用户ID）的限制，引入匿名用户体系，无需注册登录。

## 数据库迁移

### 1. 执行迁移脚本

在 Supabase SQL Editor 中执行以下迁移脚本：

```sql
-- 文件位置: supabase/migration_ip_to_user_id.sql
```

这个脚本会：
- 在所有相关表中添加 `user_id` 列
- 将现有的 `ip_address` 数据迁移到 `user_id`（作为临时方案）
- 创建新的索引以优化查询性能
- 保留 `ip_address` 列用于向后兼容

### 2. 受影响的表

- `stories` - 故事表
- `generation_times` - 创作耗时记录表
- `highlights` - 高亮/划线表
- `thoughts` - 想法/笔记表

## 功能变更

### 设备UID生成

- 每个设备首次访问时自动生成唯一的设备ID
- 设备ID存储在 `localStorage` 中，持久化保存
- 如果 `localStorage` 不可用，会尝试使用 `sessionStorage`
- 设备ID格式：`device_{timestamp}_{random}`

### API变更

所有API现在需要接收 `deviceId` 参数：

1. **POST /api/generate** - 创作故事
   - 请求体：`{ words: string, deviceId: string }`

2. **GET /api/limit** - 获取剩余次数
   - 查询参数：`?deviceId={deviceId}`

3. **POST /api/generation-time** - 保存创作耗时
   - 请求体：`{ duration: number, deviceId: string }`

4. **POST /api/highlights** - 保存高亮
   - 请求体：`{ ..., deviceId: string }`

5. **POST /api/thoughts** - 保存想法
   - 请求体：`{ ..., deviceId: string }`

### 前端变更

- 所有API调用现在自动包含设备ID
- 使用 `getDeviceId()` 函数获取设备ID
- 设备ID在首次访问时自动生成并保存

## 优势

1. **更准确的用户识别**：基于设备而非IP，避免共享IP的问题
2. **更好的用户体验**：无需注册登录，自动识别设备
3. **数据一致性**：同一设备的所有操作都关联到同一个用户ID
4. **隐私友好**：不收集个人信息，只使用匿名设备ID

## 注意事项

1. 清除浏览器数据会生成新的设备ID，被视为新用户
2. 不同浏览器/设备会有不同的设备ID
3. 如果用户清除localStorage，设备ID会重新生成
4. `ip_address` 字段保留但不再使用，用于向后兼容

## 回滚方案

如果需要回滚到IP限制：

1. 恢复旧的API代码（使用IP而非deviceId）
2. 数据库中的 `user_id` 列可以保留或删除
3. 恢复使用 `ip_address` 字段进行查询

