import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  validateDeviceId, 
  getDailyLimit, 
  getTodayDateRange, 
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
import type { Story } from '@/types/story'

export async function POST(request: NextRequest) {
  try {
    // 检查请求体大小
    const maxSize = getRequestSizeLimit('/api/generate')
    if (!checkRequestSize(request, maxSize)) {
      return createErrorResponse('请求体过大', 413)
    }

    const { words, deviceId } = await request.json()

    // 速率限制检查（在验证之前，防止滥用）
    const identifier = getClientIdentifier(request, deviceId)
    const rateLimitResult = await checkRateLimitDB(
      identifier,
      RATE_LIMIT_CONFIGS.GENERATE_STORY
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_CONFIGS.GENERATE_STORY.message)
    }

    // Validate input
    if (!words || typeof words !== 'string') {
      return createErrorResponse('请输入1-3个字', 400)
    }

    const trimmedWords = words.trim()
    if (trimmedWords.length === 0 || trimmedWords.length > 3) {
      return createErrorResponse('请输入1-3个字', 400)
    }

    // Validate device ID
    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    // Check daily limit (从环境变量 DAILY_STORY_LIMIT 读取，默认 5)
    // 这个检查必须在调用 DeepSeek API 之前进行，确保 API 有拦截
    const { start, end } = getTodayDateRange()
    const dailyLimit = getDailyLimit()

    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', deviceId)
      .gte('created_at', start)
      .lt('created_at', end)

    // 如果查询失败，为了安全起见，拒绝请求
    if (countError) {
      return createErrorResponse(
        '无法验证创作次数限制，请稍后重试',
        500,
        { limit: dailyLimit, used: 0 }
      )
    }

    // 确保 count 不为 null，如果为 null 则视为 0
    const usedCount = count ?? 0
    
    // 严格检查：如果已达到或超过限制，立即拦截
    // 这个拦截确保即使前端验证被绕过，API 也会拒绝请求
    if (usedCount >= dailyLimit) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API拦截] Daily limit reached for user ${deviceId}: ${usedCount}/${dailyLimit}`)
      }
      return createErrorResponse(
        '今日创作次数已用完，请明天再试',
        429,
        { limit: dailyLimit, used: usedCount, remaining: 0 }
      )
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API验证通过] User ${deviceId} 剩余次数: ${dailyLimit - usedCount}/${dailyLimit}`)
    }

    // Call DeepSeek API
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekApiKey) {
      return createErrorResponse('DeepSeek API key 未配置', 500)
    }

    const wordCount = trimmedWords.length
    const wordDesc = wordCount === 1 ? '这个字' : wordCount === 2 ? '这两个字' : '这三个字'
    
    const prompt = `请根据"${trimmedWords}"${wordDesc}，用「简体中文」创作一个有趣又引人思考的短故事。故事应该：
1. 围绕${wordDesc}展开
2. 有创意和想象力
3. 能引发读者的思考
4. 长度控制在300-500字左右

请直接输出故事内容，不要包含标题或其他说明文字，也不要使用繁体中文。`

    let response: Response
    try {
      response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      })
    } catch (fetchError) {
      return handleExternalApiError(fetchError, 'DeepSeek', '生成故事失败，请稍后重试')
    }

    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        const errorText = await response.text()
        errorData = { error: { message: errorText } }
      }
      
      return handleExternalApiError(
        errorData.error || errorData,
        'DeepSeek',
        '生成故事失败，请稍后重试'
      )
    }

    const data = await response.json()
    const storyContent = data.choices?.[0]?.message?.content?.trim()

    if (!storyContent) {
      return createErrorResponse('生成的故事内容为空', 500)
    }

    // 尝试获取当前用户的昵称（如果有的话），用于显示创作人
    let authorNickname: string | null = null
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('nickname')
        .eq('id', deviceId)
        .single()

      if (!profileError && profile?.nickname) {
        authorNickname = profile.nickname as string
      }
    } catch {
      // 忽略昵称查询错误，不影响故事生成
    }

    // Save to database
    const { data: story, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert({
        words: trimmedWords,
        content: storyContent,
        user_id: deviceId,
        ip_address: null,
        author_nickname: authorNickname
      })
      .select()
      .single()

    if (dbError) {
      return handleDatabaseError(dbError, '保存故事失败')
    }

    return createSuccessResponse({ story: story as Story })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

