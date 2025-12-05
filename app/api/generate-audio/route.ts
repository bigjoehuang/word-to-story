import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  validateUUID, 
  handleDatabaseError, 
  handleExternalApiError 
} from '@/lib/api-utils'
import { 
  getClientIdentifier, 
  checkRateLimitDB, 
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit
} from '@/lib/rate-limit'
import WebSocket from 'ws'
import { randomUUID } from 'crypto'

/**
 * 上传音频数据到Supabase Storage
 */
async function uploadAudioToStorage(audioData: Buffer, storyId: string): Promise<string> {
  const fileName = `audio/${storyId}-${Date.now()}.mp3`
  
  const { error } = await supabaseAdmin.storage
    .from('audio') // 需要在Supabase中创建audio存储桶
    .upload(fileName, audioData, {
      contentType: 'audio/mpeg',
      upsert: false,
    })
  
  if (error) {
    throw new Error(`上传音频失败: ${error.message}`)
  }
  
  // 获取公共URL
  const { data: urlData } = supabaseAdmin.storage
    .from('audio')
    .getPublicUrl(fileName)
  
  if (!urlData?.publicUrl) {
    throw new Error('获取音频URL失败')
  }
  
  return urlData.publicUrl
}

/**
 * 构建二进制帧（根据火山引擎WebSocket v3协议）
 * 参考文档: https://www.volcengine.com/docs/6561/1668014?lang=zh
 */
function buildBinaryFrame(
  eventType: number,
  sessionId: string,
  payload: string | Buffer,
  isFinishConnection: boolean = false
): Buffer {
  // Header (4 bytes)
  // Byte 0: Protocol version (0b0001) | Header size (0b0001 = 4 bytes)
  const byte0 = 0x11 // 0b0001_0001
  
  // Byte 1: Message type (0b1001 = Full-client request) | Flags
  // isFinishConnection时flags为0b0100，否则为0b0000
  const byte1 = isFinishConnection ? 0x94 : 0x90 // 0b1001_0100 or 0b1001_0000
  
  // Byte 2: Serialization (0b0001 = JSON) | Compression (0b0000 = none)
  const byte2 = 0x10 // 0b0001_0000
  
  // Byte 3: Reserved
  const byte3 = 0x00
  
  // Event type (4 bytes, big-endian)
  const eventTypeBuffer = Buffer.allocUnsafe(4)
  eventTypeBuffer.writeUInt32BE(eventType, 0)
  
  // Session ID length (4 bytes, big-endian)
  const sessionIdBuffer = Buffer.from(sessionId, 'utf-8')
  const sessionIdLengthBuffer = Buffer.allocUnsafe(4)
  sessionIdLengthBuffer.writeUInt32BE(sessionIdBuffer.length, 0)
  
  // Payload
  const payloadBuffer = typeof payload === 'string' 
    ? Buffer.from(payload, 'utf-8') 
    : payload
  
  // Payload length (4 bytes, big-endian)
  const payloadLengthBuffer = Buffer.allocUnsafe(4)
  payloadLengthBuffer.writeUInt32BE(payloadBuffer.length, 0)
  
  // 组合所有部分
  return Buffer.concat([
    Buffer.from([byte0, byte1, byte2, byte3]), // Header (4 bytes)
    eventTypeBuffer, // Event type (4 bytes)
    sessionIdLengthBuffer, // Session ID length (4 bytes)
    sessionIdBuffer, // Session ID
    payloadLengthBuffer, // Payload length (4 bytes)
    payloadBuffer // Payload
  ])
}

/**
 * 解析二进制响应帧
 */
function parseBinaryFrame(buffer: Buffer): {
  eventType: number
  sessionId: string
  payload: Buffer
  isAudio: boolean
} | null {
  if (buffer.length < 4) return null
  
  const byte1 = buffer[1]
  const messageType = (byte1 >> 4) & 0x0F
  
  // 音频帧: 0b1011, 其他帧: 0b1001
  const isAudio = messageType === 0x0B
  
  // 跳过header (4 bytes)
  let offset = 4
  
  // Event type (4 bytes, big-endian)
  if (buffer.length < offset + 4) return null
  const eventType = buffer.readUInt32BE(offset)
  offset += 4
  
  // Session ID length (4 bytes, big-endian)
  if (buffer.length < offset + 4) return null
  const sessionIdLength = buffer.readUInt32BE(offset)
  offset += 4
  
  // Session ID
  if (buffer.length < offset + sessionIdLength) return null
  const sessionId = buffer.slice(offset, offset + sessionIdLength).toString('utf-8')
  offset += sessionIdLength
  
  // Payload length (4 bytes, big-endian)
  if (buffer.length < offset + 4) return null
  const payloadLength = buffer.readUInt32BE(offset)
  offset += 4
  
  // Payload
  if (buffer.length < offset + payloadLength) return null
  const payload = buffer.slice(offset, offset + payloadLength)
  
  return {
    eventType,
    sessionId,
    payload,
    isAudio
  }
}

/**
 * 火山引擎TTS API调用（使用WebSocket）
 * 参考文档: https://www.volcengine.com/docs/6561/1668014?lang=zh
 */
async function callVolcengineTTS(
  text: string, 
  appId: string,
  accessToken: string,
  storyId: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // WebSocket endpoint
    const wsUrl = process.env.VOLCENGINE_TTS_ENDPOINT || 'wss://openspeech.bytedance.com/api/v3/sami/podcasttts'
    
    // 生成session ID (12字符)
    const sessionId = randomUUID().replace(/-/g, '').substring(0, 12)
    
    // 构建请求headers（根据火山引擎文档）
    // 注意：headers的key必须完全匹配文档要求
    const headers: Record<string, string> = {
      'X-Api-App-Id': appId.trim(),
      'X-Api-Access-Key': accessToken.trim(),
      'X-Api-Resource-Id': 'volc.service_type.10050', // 播客语音合成
      'X-Api-App-Key': 'aGjiRDfUWi', // 固定值
      'X-Api-Request-Id': randomUUID(),
    }
    
    // 开发环境下验证headers
    if (process.env.NODE_ENV === 'development') {
      console.log('WebSocket连接信息:')
      console.log('URL:', wsUrl)
      console.log('App ID:', appId ? `${appId.substring(0, 8)}...` : '未设置')
      console.log('Access Token:', accessToken ? `${accessToken.substring(0, 8)}...` : '未设置')
      console.log('Headers keys:', Object.keys(headers))
    }
    
    // 创建WebSocket连接
    const ws = new WebSocket(wsUrl, {
      headers,
      perMessageDeflate: false // 禁用压缩，避免问题
    })
    
    const audioChunks: Buffer[] = []
    let finalAudioUrl: string | null = null
    let hasError = false
    
    // 监听连接建立前的upgrade事件，检查响应
    ws.on('upgrade', (response) => {
      if (response.statusCode !== 101) {
        hasError = true
        let errorMsg = `WebSocket连接失败: ${response.statusCode}`
        if (response.statusMessage) {
          errorMsg += ` - ${response.statusMessage}`
        }
        // 尝试读取响应体
        response.on('data', (chunk) => {
          try {
            const errorData = JSON.parse(chunk.toString())
            if (errorData.message) {
              errorMsg += ` - ${errorData.message}`
            }
          } catch {
            errorMsg += ` - ${chunk.toString()}`
          }
        })
        reject(new Error(errorMsg))
      }
    })
    
    ws.on('open', () => {
      // 构建StartSession payload
      const payload = JSON.stringify({
        input_id: storyId,
        input_text: text,
        action: 0, // 根据提供的input_text总结生成播客
        use_head_music: false,
        use_tail_music: false,
        audio_config: {
          format: 'mp3',
          sample_rate: parseInt(process.env.VOLCENGINE_SAMPLE_RATE || '24000', 10),
          speech_rate: 0,
        },
        input_info: {
          return_audio_url: true, // 返回完整音频URL
        }
      })
      
      // 发送StartSession帧 (event type = 1)
      const frame = buildBinaryFrame(1, sessionId, payload)
      ws.send(frame)
    })
    
    ws.on('message', (data: Buffer) => {
      try {
        const frame = parseBinaryFrame(data)
        if (!frame) return
        
        const { eventType, payload, isAudio } = frame
        
        // Event 150: SessionStarted
        if (eventType === 150) {
          // 会话开始，等待音频数据
          return
        }
        
        // Event 361: PodcastRoundResponse - 音频数据
        if (eventType === 361 && isAudio) {
          audioChunks.push(payload)
          return
        }
        
        // Event 363: PodcastEnd - 包含audio_url
        if (eventType === 363) {
          try {
            const metaInfo = JSON.parse(payload.toString('utf-8'))
            if (metaInfo.meta_info?.audio_url) {
              finalAudioUrl = metaInfo.meta_info.audio_url
            }
          } catch {
            // 忽略JSON解析错误
          }
          return
        }
        
        // Event 152: SessionFinished
        if (eventType === 152) {
          // 会话结束
          ws.close()
          return
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error)
      }
    })
    
    ws.on('error', (error: Error & { code?: string; statusCode?: number }) => {
      hasError = true
      let errorMsg = `WebSocket错误: ${error.message}`
      if (error.code) {
        errorMsg += ` (code: ${error.code})`
      }
      if (error.statusCode) {
        errorMsg += ` (status: ${error.statusCode})`
      }
      reject(new Error(errorMsg))
    })
    
    // 监听HTTP响应（在WebSocket升级之前）
    ws.on('unexpected-response', (request, response) => {
      hasError = true
      let errorMsg = `WebSocket连接被拒绝: ${response.statusCode}`
      if (response.statusMessage) {
        errorMsg += ` - ${response.statusMessage}`
      }
      
      // 读取响应体
      let responseBody = ''
      response.on('data', (chunk) => {
        responseBody += chunk.toString()
      })
      response.on('end', () => {
        try {
          if (responseBody) {
            const errorData = JSON.parse(responseBody)
            if (errorData.message) {
              errorMsg += ` - ${errorData.message}`
            }
            if (errorData.code) {
              errorMsg += ` (code: ${errorData.code})`
            }
            if (errorData.error) {
              errorMsg += ` - ${JSON.stringify(errorData.error)}`
            }
          }
        } catch {
          if (responseBody) {
            errorMsg += ` - ${responseBody}`
          }
        }
        
        // 添加排查建议
        if (response.statusCode === 403) {
          errorMsg += '\n\n排查建议：'
          errorMsg += '\n1. 检查 VOLCENGINE_APP_ID 和 VOLCENGINE_ACCESS_TOKEN 是否正确设置'
          errorMsg += '\n2. 确认已开通"语音播客大模型"服务（不是普通TTS服务）'
          errorMsg += '\n3. 确认appid和access_token来自同一应用'
          errorMsg += '\n4. 检查凭证是否过期，可在控制台重新生成'
        }
        
        reject(new Error(errorMsg))
      })
    })
    
    ws.on('close', (code, reason) => {
      if (hasError) return
      
      // 如果收到了audio_url，直接使用
      if (finalAudioUrl) {
        resolve(finalAudioUrl)
        return
      }
      
      // 否则使用收集的音频chunks
      if (audioChunks.length > 0) {
        const audioBuffer = Buffer.concat(audioChunks)
        uploadAudioToStorage(audioBuffer, storyId)
          .then(resolve)
          .catch(reject)
      } else {
        reject(new Error('未收到音频数据'))
      }
    })
    
    // 设置超时（5分钟）
    setTimeout(() => {
      if (!ws.CLOSED && !ws.CLOSING) {
        hasError = true
        ws.close()
        reject(new Error('请求超时'))
      }
    }, 5 * 60 * 1000)
  })
}

export async function POST(request: NextRequest) {
  try {
    // 检查请求体大小
    const maxSize = getRequestSizeLimit('/api/generate-audio')
    if (!checkRequestSize(request, maxSize)) {
      return createErrorResponse('请求体过大', 413)
    }

    const { storyId, content, deviceId } = await request.json()

    // 速率限制检查
    const identifier = getClientIdentifier(request, deviceId)
    const rateLimitResult = await checkRateLimitDB(
      identifier,
      RATE_LIMIT_CONFIGS.GENERATE_IMAGE // 复用图片生成的速率限制配置
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, '音频生成请求过于频繁，请稍后再试')
    }

    if (!validateUUID(storyId)) {
      return createErrorResponse('缺少或无效的故事ID', 400)
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('缺少故事内容', 400)
    }

    // 检查故事是否存在
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('id, content, audio_url')
      .eq('id', storyId)
      .single()

    if (storyError || !story) {
      return createErrorResponse('故事不存在', 404)
    }

    // 如果已经有音频URL，直接返回
    if (story.audio_url) {
      return createSuccessResponse({ 
        audio_url: story.audio_url,
        cached: true 
      })
    }

    // 首先检查是否启用了播客功能
    const enablePodcast = process.env.ENABLE_PODCAST_AUDIO === 'true' || 
                         process.env.NEXT_PUBLIC_ENABLE_PODCAST_AUDIO === 'true'
    
    if (!enablePodcast) {
      return createErrorResponse(
        '播客功能已禁用。如需启用，请设置 ENABLE_PODCAST_AUDIO=true 环境变量。',
        503 // Service Unavailable
      )
    }

    // 火山引擎API配置
    const volcengineAppId = process.env.VOLCENGINE_APP_ID
    const volcengineAccessToken = process.env.VOLCENGINE_ACCESS_TOKEN

    // 检查API是否已配置
    const isApiConfigured = volcengineAppId && 
                            volcengineAccessToken && 
                            volcengineAppId !== 'your_volcengine_app_id' &&
                            volcengineAccessToken !== 'your_volcengine_access_token'

    if (!isApiConfigured) {
      return createErrorResponse(
        '火山引擎播客API未配置。如需使用音频功能，请在火山引擎控制台开通"语音播客大模型"服务并配置环境变量。',
        503 // Service Unavailable
      )
    }

    // 调用火山引擎TTS API生成音频
    let audioUrl: string
    try {
      audioUrl = await callVolcengineTTS(content, volcengineAppId, volcengineAccessToken, storyId)
    } catch (error) {
      return handleExternalApiError(error, '火山引擎TTS', '生成音频失败，请稍后重试')
    }

    // 更新故事记录，保存音频URL
    const { error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ audio_url: audioUrl })
      .eq('id', storyId)

    if (updateError) {
      return handleDatabaseError(updateError, '保存音频URL失败')
    }

    return createSuccessResponse({ 
      audio_url: audioUrl,
      cached: false 
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}
