# 播客音频功能设置指南

本文档说明如何配置和使用火山引擎TTS API为故事生成播客音频。

## 功能概述

故事页面现在支持播客音频播放功能。用户可以：
- 点击播放按钮生成并播放故事的音频版本
- 控制播放进度、暂停/继续、静音/取消静音
- 音频URL会保存到数据库，避免重复生成

## 配置步骤

### 1. 获取火山引擎API凭证

1. 访问 [火山引擎控制台](https://console.volcengine.com/)
2. 注册并完成实名认证
3. 开通"语音播客大模型"服务（注意：不是普通的"语音合成"服务）
4. 进入"应用管理"页面，创建新应用
5. 在创建应用时，勾选"语音播客大模型"服务
6. 创建成功后，在应用详情页获取：
   - `appid` (应用ID) - 对应环境变量 `VOLCENGINE_APP_ID`
   - `access_token` (访问令牌) - 对应环境变量 `VOLCENGINE_ACCESS_TOKEN`

**重要提示：**
- 必须开通"语音播客大模型"服务，而不是普通的TTS服务
- 确保应用已正确配置并激活
- Access Token 需要是有效的访问令牌

### 2. 配置环境变量

在 `.env.local` 文件中添加以下配置：

```env
# 是否启用播客音频功能（必须设置为 true 才能使用）
ENABLE_PODCAST_AUDIO=true

# 火山引擎 TTS API Configuration (WebSocket协议)
VOLCENGINE_APP_ID=your_volcengine_app_id
VOLCENGINE_ACCESS_TOKEN=your_volcengine_access_token

# 可选配置
VOLCENGINE_TTS_ENDPOINT=wss://openspeech.bytedance.com/api/v3/sami/podcasttts
VOLCENGINE_SAMPLE_RATE=24000
```

**重要提示：**
- `ENABLE_PODCAST_AUDIO` 必须设置为 `true` 才会显示音频播放器
- 如果设置为 `false` 或不设置，音频播放器将不会显示
- 即使配置了 API 凭证，如果 `ENABLE_PODCAST_AUDIO` 不为 `true`，功能也不会启用

### 3. 执行数据库迁移

运行以下SQL迁移脚本，为stories表添加audio_url字段：

```sql
-- 文件位置: supabase/migration_add_audio_url.sql
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS audio_url TEXT;
```

### 4. 创建Supabase Storage存储桶（可选）

如果火山引擎API返回的是音频数据而不是URL，需要创建存储桶来存储音频文件：

1. 在Supabase Dashboard中进入 **Storage**
2. 创建名为 `audio` 的存储桶
3. 设置为公开访问（Public），以便前端可以直接访问音频文件

### 5. 调整API参数（如需要）

根据实际需求，可以通过环境变量调整以下参数：

1. **语音类型** (`VOLCENGINE_VOICE_TYPE`)：选择不同的音色
2. **采样率** (`VOLCENGINE_SAMPLE_RATE`)：音频质量，默认24000
3. **语速** (`VOLCENGINE_SPEED_RATIO`)：播放速度，默认1.0
4. **音量** (`VOLCENGINE_VOLUME_RATIO`)：音量大小，默认1.0
5. **音调** (`VOLCENGINE_PITCH_RATIO`)：音调高低，默认1.0

## API文档参考

- [火山引擎播客API文档](https://www.volcengine.com/docs/6561/1668014?lang=zh)

## 使用说明

### 用户端

1. 打开任意故事页面
2. 在故事内容下方找到音频播放器
3. 点击播放按钮
4. 首次播放时会自动生成音频（可能需要几秒钟）
5. 生成完成后自动开始播放

### 开发端

#### API端点

**POST** `/api/generate-audio`

请求体：
```json
{
  "storyId": "story-uuid",
  "content": "故事内容",
  "deviceId": "device-id"
}
```

响应：
```json
{
  "success": true,
  "audio_url": "https://...",
  "cached": false
}
```

#### 组件使用

```tsx
import AudioPlayer from '@/components/AudioPlayer'

<AudioPlayer
  storyId={story.id}
  content={story.content}
  audioUrl={story.audio_url}
/>
```

## 注意事项

1. **API调用限制**：音频生成请求受到速率限制，与图片生成共享相同的限制配置
2. **存储成本**：如果使用Supabase Storage存储音频，请注意存储成本
3. **音频格式**：当前默认使用MP3格式，可在API中调整
4. **错误处理**：如果API调用失败，会在播放器中显示错误提示

## 故障排除

### 音频生成失败

#### 403错误（认证失败）

如果遇到403错误，请检查：

1. **环境变量配置**
   - 确认 `VOLCENGINE_APP_ID` 和 `VOLCENGINE_ACCESS_TOKEN` 已正确设置
   - 确认值不是占位符（如 `your_volcengine_app_id`）
   - 确认没有多余的空格或引号

2. **服务开通状态**
   - 确认已开通"语音播客大模型"服务（不是普通的TTS服务）
   - 确认应用已激活且状态正常
   - 确认服务配额充足

3. **凭证有效性**
   - 确认 `appid` 和 `access_token` 是从正确的应用获取的
   - 确认凭证未过期
   - 可以在火山引擎控制台重新生成新的 access_token

4. **查看详细错误**
   - 检查服务器日志获取完整的错误信息
   - 错误信息会包含具体的失败原因

#### 其他常见错误

- **400错误**：检查请求参数格式
- **401错误**：认证信息无效，检查access_token
- **500错误**：服务器内部错误，稍后重试

### 音频无法播放

1. 检查音频URL是否可访问
2. 检查浏览器控制台是否有CORS错误
3. 确认音频文件格式是否被浏览器支持

### 存储桶错误

如果遇到存储桶相关错误：
1. 确认Supabase Storage中已创建 `audio` 存储桶
2. 确认存储桶权限设置为公开
3. 检查Service Role Key是否有存储访问权限

## 后续优化建议

1. 添加音频生成进度提示
2. 支持音频下载功能
3. 添加播放速度调节
4. 支持后台播放
5. 添加音频缓存策略

