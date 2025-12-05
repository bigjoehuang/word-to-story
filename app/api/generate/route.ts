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

    const { words, deviceId, style, length, characterType, characterName } = await request.json()

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

    // 防止同一用户并行创作：获取生成锁
    let lockAcquired = false
    try {
      const { error: lockError } = await supabaseAdmin
        .from('generation_locks')
        .insert({ user_id: deviceId })

      // 如果已经存在相同 user_id 的记录（并发请求），数据库会返回唯一约束错误
      if (lockError) {
        // PostgreSQL 唯一约束错误代码 23505
        const dbError = lockError as { code?: string; message?: string }
        const isDuplicate =
          dbError.code === '23505' ||
          (typeof dbError.message === 'string' &&
            dbError.message.includes('duplicate key value') &&
            dbError.message.includes('generation_locks_pkey'))

        if (isDuplicate) {
          return createErrorResponse('正在为你创作上一个故事，请稍后再试', 429)
        }

        return handleDatabaseError(lockError, '获取创作锁失败')
      }

      lockAcquired = true

      // Call DeepSeek API
      const deepseekApiKey = process.env.DEEPSEEK_API_KEY
      if (!deepseekApiKey) {
        return createErrorResponse('DeepSeek API key 未配置', 500)
      }

      const wordCount = trimmedWords.length
      const wordDesc = wordCount === 1 ? '这个字' : wordCount === 2 ? '这两个字' : '这三个字'

      const safeStyle =
        typeof style === 'string'
          ? (style as string)
          : 'default'

      const safeLength =
        typeof length === 'string' && ['short', 'medium', 'long'].includes(length)
          ? (length as 'short' | 'medium' | 'long')
          : 'medium'

      // 根据长度设置不同的字数要求
      let lengthInstruction = ''
      switch (safeLength) {
        case 'short':
          lengthInstruction = '4. 长度控制在150-250字左右，短小精干，简洁有力，快速传达核心思想'
          break
        case 'long':
          lengthInstruction = '4. 长度控制在600-800字左右，可以有更丰富的细节和情节，更深入地探讨主题'
          break
        case 'medium':
        default:
          lengthInstruction = '4. 长度控制在300-500字左右，平衡长度与深度'
          break
      }

      const basePrompt = `请根据「${trimmedWords}」${wordDesc}，用「简体中文」创作一个有趣又引人思考的短故事。故事应该：
1. 围绕${wordDesc}展开
2. 有创意和想象力
3. 能引发读者的思考
${lengthInstruction}`

      // 处理角色信息（支持1-3个角色，用空格分隔）
      let characterInstruction = ''
      let savedCharacterName: string | null = null
      if (characterType && characterName && typeof characterName === 'string' && characterName.trim()) {
        const trimmedCharacterName = characterName.trim()
        // 按空格分割角色名
        const characterNames = trimmedCharacterName.split(/\s+/).filter(n => n.length > 0)
        
        // 验证角色数量（1-3个）
        if (characterNames.length >= 1 && characterNames.length <= 3) {
          // 验证每个角色名长度（1-10个字符）和字符类型
          const validNames = characterNames.filter(name => {
            return name.length >= 1 && 
                   name.length <= 10 && 
                   /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(name)
          })
          
          if (validNames.length === characterNames.length) {
            savedCharacterName = validNames.join(' ')
            
            // 生成角色指令
            if (validNames.length === 1) {
              characterInstruction = `\n故事的主角是「${validNames[0]}」，请围绕这个角色展开故事。如果这是一个经典角色（如武侠小说或影视作品中的角色），请保持角色的性格特点和背景设定；如果是自定义名字，请根据名字的特点来塑造角色形象。`
            } else {
              const namesList = validNames.map(n => `「${n}」`).join('、')
              characterInstruction = `\n故事的主要角色是${namesList}（共${validNames.length}个角色），请围绕这些角色展开故事。如果这些是经典角色（如武侠小说或影视作品中的角色），请保持角色的性格特点和背景设定；如果是自定义名字，请根据名字的特点来塑造角色形象。确保这些角色在故事中都有适当的戏份和互动。`
            }
          }
        }
      }

      let styleInstruction = ''
      switch (safeStyle) {
        case 'warm':
          styleInstruction =
            '\n5. 故事整体氛围偏温柔、治愈，多一点情感与陪伴感，在引发思考的同时给读者细腻的安慰'
          break
        case 'humor':
          styleInstruction =
            '\n5. 语言可以稍微轻松幽默，用有趣细节包装背后的道理，但不要写成纯搞笑段子或网络段子体'
          break
        case 'realistic':
          styleInstruction =
            '\n5. 场景和人物更贴近日常生活，通过具体而真实的细节，让读者在熟悉感中体会到现实里的哲理'
          break
        case 'fantasy':
          styleInstruction =
            '\n5. 可以适当加入奇幻或象征性的设定，让故事更像现代寓言，在情节与意象背后藏着思考'
          break
        default:
          // 保持现有默认风格，不额外添加限制
          styleInstruction = ''
      }

      const prompt = `${basePrompt}${characterInstruction}${styleInstruction}

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
        let errorData: unknown
        try {
          errorData = await response.json()
        } catch {
          const errorText = await response.text()
          errorData = { error: { message: errorText } }
        }
        
        const errorPayload = (errorData as { error?: unknown })?.error || errorData

        return handleExternalApiError(
          errorPayload,
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
          author_nickname: authorNickname,
          character_name: savedCharacterName
        })
        .select()
        .single()

      if (dbError) {
        return handleDatabaseError(dbError, '保存故事失败')
      }

      return createSuccessResponse({ story: story as Story })
    } finally {
      if (lockAcquired) {
        // 释放当前用户的创作锁，避免长时间占用
        try {
          await supabaseAdmin
            .from('generation_locks')
            .delete()
            .eq('user_id', deviceId)
        } catch {
          // 删除锁失败时仅记录日志，不影响主流程响应
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[API警告] 释放生成锁失败 user_id=${deviceId}`)
          }
        }
      }
    }
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

