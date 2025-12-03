import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { words, deviceId } = await request.json()

    // Validate input
    if (!words || typeof words !== 'string') {
      return NextResponse.json(
        { error: '请输入1-3个字' },
        { status: 400 }
      )
    }

    const trimmedWords = words.trim()
    if (trimmedWords.length === 0 || trimmedWords.length > 3) {
      return NextResponse.json(
        { error: '请输入1-3个字' },
        { status: 400 }
      )
    }

    // Validate device ID
    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json(
        { error: '缺少设备ID' },
        { status: 400 }
      )
    }

    // Check daily limit (从环境变量 DAILY_STORY_LIMIT 读取，默认 5)
    // 这个检查必须在调用 DeepSeek API 之前进行，确保 API 有拦截
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', deviceId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // 从环境变量获取每日限制，默认为 5
    const dailyLimit = parseInt(process.env.DAILY_STORY_LIMIT || '5', 10)
    
    // 如果查询失败，为了安全起见，拒绝请求
    if (countError) {
      console.error('Count stories error:', countError)
      return NextResponse.json(
        { 
          error: '无法验证创作次数限制，请稍后重试',
          limit: dailyLimit,
          used: 0
        },
        { status: 500 }
      )
    }

    // 确保 count 不为 null，如果为 null 则视为 0
    const usedCount = count ?? 0
    
    // 严格检查：如果已达到或超过限制，立即拦截
    // 这个拦截确保即使前端验证被绕过，API 也会拒绝请求
    if (usedCount >= dailyLimit) {
      console.log(`[API拦截] Daily limit reached for user ${deviceId}: ${usedCount}/${dailyLimit}`)
      return NextResponse.json(
        { 
          error: '今日创作次数已用完，请明天再试',
          limit: dailyLimit,
          used: usedCount,
          remaining: 0
        },
        { status: 429 } // 429 Too Many Requests
      )
    }
    
    console.log(`[API验证通过] User ${deviceId} 剩余次数: ${dailyLimit - usedCount}/${dailyLimit}`)

    // Call DeepSeek API
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekApiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key 未配置' },
        { status: 500 }
      )
    }

    const wordCount = trimmedWords.length
    const wordDesc = wordCount === 1 ? '这个字' : wordCount === 2 ? '这两个字' : '这三个字'
    
    const prompt = `请根据"${trimmedWords}"${wordDesc}，创作一个有趣又引人思考的短故事。故事应该：
1. 围绕${wordDesc}展开
2. 有创意和想象力
3. 能引发读者的思考
4. 长度控制在300-500字左右

请直接输出故事内容，不要包含标题或其他说明文字。`

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
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

    if (!response.ok) {
      let errorMessage = '生成故事失败，请稍后重试'
      try {
        const errorData = await response.json()
        console.error('DeepSeek API error:', errorData)
        
        // Handle specific error cases
        if (errorData.error) {
          if (errorData.error.message?.includes('Insufficient Balance') || 
              errorData.error.message?.includes('余额不足')) {
            errorMessage = 'DeepSeek API 余额不足，请充值后重试'
          } else if (errorData.error.message?.includes('Invalid API key') ||
                     errorData.error.message?.includes('API key')) {
            errorMessage = 'DeepSeek API Key 无效，请检查配置'
          } else if (errorData.error.message) {
            errorMessage = `DeepSeek API 错误: ${errorData.error.message}`
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        const errorText = await response.text()
        console.error('DeepSeek API error (text):', errorText)
        if (errorText.includes('Insufficient Balance') || errorText.includes('余额不足')) {
          errorMessage = 'DeepSeek API 余额不足，请充值后重试'
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    const data = await response.json()
    const storyContent = data.choices?.[0]?.message?.content?.trim()

    if (!storyContent) {
      return NextResponse.json(
        { error: '生成的故事内容为空' },
        { status: 500 }
      )
    }

    // Save to database
    const { data: story, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert({
        words: trimmedWords,
        content: storyContent,
        user_id: deviceId,
        ip_address: null // 保留字段但不再使用
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: '保存故事失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ story }, { status: 200 })
  } catch (error) {
    console.error('Generate story error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

