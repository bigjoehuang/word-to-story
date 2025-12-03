import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { words } = await request.json()

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

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Check daily limit (5 stories per IP per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (countError) {
      console.error('Count stories error:', countError)
      // Continue even if count fails, but log the error
    }

    const dailyLimit = 5
    if (count !== null && count >= dailyLimit) {
      return NextResponse.json(
        { 
          error: `今日创作次数已达上限（${dailyLimit}次），请明天再试`,
          limit: dailyLimit,
          used: count
        },
        { status: 429 } // 429 Too Many Requests
      )
    }

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
        ip_address: ip
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

