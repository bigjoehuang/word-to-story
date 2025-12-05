import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateUUID, handleDatabaseError, handleExternalApiError } from '@/lib/api-utils'
import { 
  getClientIdentifier, 
  checkRateLimitDB, 
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit
} from '@/lib/rate-limit'
import { ALL_CHARACTERS } from '@/lib/character-dict'

export async function POST(request: NextRequest) {
  try {
    // 检查请求体大小
    const maxSize = getRequestSizeLimit('/api/generate-image')
    if (!checkRequestSize(request, maxSize)) {
      return createErrorResponse('请求体过大', 413)
    }

    const { storyId, words, content, deviceId } = await request.json()

    // 速率限制检查
    const identifier = getClientIdentifier(request, deviceId)
    const rateLimitResult = await checkRateLimitDB(
      identifier,
      RATE_LIMIT_CONFIGS.GENERATE_IMAGE
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_CONFIGS.GENERATE_IMAGE.message)
    }

    if (!validateUUID(storyId)) {
      return createErrorResponse('缺少或无效的故事ID', 400)
    }

    if (!words || typeof words !== 'string' || words.trim().length === 0) {
      return createErrorResponse('缺少关键词', 400)
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('缺少故事内容', 400)
    }

    // 从数据库获取故事的完整信息，包括角色信息
    const { data: story, error: storyError } = await supabaseAdmin
      .from('stories')
      .select('character_name')
      .eq('id', storyId)
      .single()

    if (storyError) {
      // 如果查询失败，继续执行，但不包含角色信息
      if (process.env.NODE_ENV === 'development') {
        console.warn('获取故事角色信息失败:', storyError)
      }
    }

    // 处理角色信息，确保配图与角色匹配
    let characterPrompt = ''
    if (story?.character_name) {
      const characterNames = story.character_name.trim().split(/\s+/).filter((n: string) => n.length > 0)
      
      // 检查是否是系统角色
      type Character = typeof ALL_CHARACTERS[0]
      const systemCharacters: Character[] = characterNames
        .map((name: string) => ALL_CHARACTERS.find((char) => char.name === name))
        .filter((char: Character | undefined): char is Character => char !== undefined)
      
      if (systemCharacters.length > 0) {
        // 如果是系统角色，明确指定角色外观和风格
        const characterDescriptions = systemCharacters.map(char => {
          // 根据角色类别和描述，生成外观特征和风格
          let appearance = ''
          let style = ''
          
          // 根据角色类别和名称，生成更具体的外观特征和风格
          switch (char.category) {
            case 'wuxia':
              // 武侠角色：根据具体角色名称添加特征
              style = '武侠风格，古装'
              if (char.name.includes('令狐冲') || char.name.includes('杨过')) {
                appearance = '古装侠客形象，手持长剑，潇洒不羁的气质'
              } else if (char.name.includes('小龙女') || char.name.includes('黄蓉')) {
                appearance = '古装美女形象，飘逸的服饰，清丽脱俗的气质'
              } else if (char.name.includes('郭靖') || char.name.includes('乔峰')) {
                appearance = '古装大侠形象，豪气干云，具有英雄气概'
              } else {
                appearance = '古装服饰，具有武侠人物的气质和特征'
              }
              break
            case 'modern':
              // 现代/仙侠角色
              style = '现代或仙侠风格'
              if (char.name.includes('孙悟空')) {
                appearance = '齐天大圣形象，猴王特征，金箍棒，具有神话色彩'
              } else if (char.name.includes('哪吒')) {
                appearance = '三太子形象，少年英雄，具有神话色彩和现代感'
              } else if (char.name.includes('白浅') || char.name.includes('赵灵儿')) {
                appearance = '仙侠风格，古装仙女形象，飘逸美丽，具有仙气'
              } else {
                appearance = '符合当代影视作品中的形象'
              }
              break
            case 'history':
              style = '写实风格，历史感'
              appearance = '历史人物形象，符合历史记载和传统认知'
              break
            case 'classic':
              // 古典文学角色
              style = '古典文学风格'
              if (char.name.includes('孙悟空') || char.name.includes('猪八戒') || char.name.includes('沙僧') || char.name.includes('唐僧')) {
                appearance = '西游记角色形象，具有经典文学作品的视觉特征'
              } else if (char.name.includes('贾宝玉') || char.name.includes('林黛玉') || char.name.includes('薛宝钗')) {
                appearance = '红楼梦角色形象，古典文学中的贵族形象，具有时代特征'
              } else if (char.name.includes('鲁智深') || char.name.includes('武松') || char.name.includes('宋江')) {
                appearance = '水浒传角色形象，具有古典文学中的英雄特征'
              } else {
                appearance = '符合经典文学作品中的描述'
              }
              break
            case 'anime':
              style = '动漫风格'
              appearance = '具有动漫角色的特征，色彩鲜明，风格独特'
              break
            case 'fairy-tale':
              style = '童话风格'
              appearance = '具有童话角色的特征，温馨可爱'
              break
            case 'world-leaders':
              style = '写实风格，历史感'
              appearance = '历史人物形象，符合历史照片和记载，具有时代特征'
              break
            case 'unique-personalities':
              style = '写实风格'
              appearance = '具有鲜明个性特征的人物形象，符合人物性格特点'
              break
            case 'cultural-icons':
              style = '写实风格，历史感'
              appearance = '文化名人形象，符合历史照片和记载，具有文化气质'
              break
          }
          return `角色「${char.name}」：${char.description || ''}，${appearance}，风格：${style}`
        }).join('；')
        
        // 收集所有角色的风格，用于整体风格要求
        const styles = systemCharacters.map((char) => {
          switch (char.category) {
            case 'wuxia': return '武侠风格'
            case 'modern': return '现代或仙侠风格'
            case 'anime': return '动漫风格'
            case 'fairy-tale': return '童话风格'
            case 'classic': return '古典文学风格'
            default: return '写实风格'
          }
        })
        const uniqueStyles = Array.from(new Set(styles))
        const styleRequirement = uniqueStyles.length === 1 
          ? `画面风格必须与角色风格匹配，采用${uniqueStyles[0]}`
          : `画面风格必须与角色风格匹配，主要采用${uniqueStyles[0]}风格`
        
        // 对于系统角色，明确要求准确匹配，风格要与角色匹配
        if (systemCharacters.length === characterNames.length) {
          // 所有角色都是系统角色
          characterPrompt = `\n【重要】画面中必须准确呈现以下角色：${characterDescriptions}。${styleRequirement}。角色的外观、服饰、特征必须与角色身份完全匹配，不能出现与角色不符的形象。如果故事中有多个角色，画面中应包含所有主要角色。`
        } else {
          // 部分系统角色，部分自定义
          const customNames = characterNames.filter((name: string) => 
            !systemCharacters.some((char) => char.name === name)
          )
          characterPrompt = `\n【重要】画面中必须准确呈现以下角色：${characterDescriptions}${customNames.length > 0 ? `；以及自定义角色：${customNames.join('、')}` : ''}。${styleRequirement}。系统角色的外观、服饰、特征必须与角色身份完全匹配，不能出现与角色不符的形象。`
        }
      } else {
        // 如果是自定义角色，也包含角色信息
        characterPrompt = `\n故事中的主要角色：${characterNames.join('、')}。画面中应准确呈现这些角色的形象。`
      }
    }

    // 豆包API配置
    const doubaoApiKey = process.env.DOUBAO_API_KEY || process.env.DOUBAO_ACCESS_KEY

    if (!doubaoApiKey) {
      return createErrorResponse('豆包API配置未完成，请设置DOUBAO_API_KEY环境变量', 500)
    }

    // 根据故事内容生成图片描述prompt
    // 优化prompt，使其更适合图片生成，并确保角色匹配
    // 强调：风格与角色匹配，一图明意，不要文字
    const imagePrompt = `根据以下故事内容创作一幅配图：故事关键词是"${words}"，故事内容：${content.substring(0, 500)}。${characterPrompt}要求：画面简洁明了，一图明意，能够清晰表达故事的核心主题和氛围。画面中不要出现任何文字、标签、水印或文字说明。电影大片质感，细腻的色彩层次，自然的光影效果，具有艺术感。`

    // 调用豆包图片生成API
    // 使用 /api/v3/images/generations 端点（正确的图片生成端点）
    const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/images/generations'
    
    // 使用Bearer token认证
    const authHeader = `Bearer ${doubaoApiKey}`

    // 获取模型endpoint ID（从环境变量获取，如果没有则使用默认值）
    const modelEndpoint = process.env.DOUBAO_IMAGE_MODEL || 'ep-20251203112650-nhdh4'

    // 构建请求体 - 使用正确的图片生成API格式
    // size 参数支持的选项：
    // - "1K" (1024x1024) - 标准正方形
    // - "2K" (2048x2048) - 高分辨率正方形
    // - "512x512" - 小尺寸正方形
    // - "768x768" - 中等尺寸正方形
    // - "1024x1024" - 标准正方形（等同于1K）
    // - "1024x1792" - 竖版（适合手机屏幕）
    // - "1792x1024" - 横版（适合电脑屏幕）
    const requestBody = {
      model: modelEndpoint, // endpoint ID格式的模型
      prompt: imagePrompt,
      sequential_image_generation: 'disabled',
      response_format: 'url', // 返回URL而不是base64
      size: '1K', // 图片尺寸：'1K', '2K', '512x512', '768x768', '1024x1024', '1024x1792', '1792x1024'
      stream: false,
      watermark: true // 添加水印
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      let errorData: any
      try {
        const errorText = await response.text()
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: '图片生成失败，请稍后重试' } }
      }
      
      return handleExternalApiError(
        errorData.error || errorData,
        '豆包',
        '图片生成失败，请稍后重试'
      )
    }

    const data = await response.json()
    
    // 解析返回的图片URL
    let imageUrl = ''
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      imageUrl = data.data[0].url || data.data[0].b64_json || ''
    } else if (data.url) {
      imageUrl = data.url
    } else if (data.image_url) {
      imageUrl = data.image_url
    }

    if (!imageUrl) {
      return createErrorResponse('图片生成成功但无法获取图片地址，请检查API响应格式', 500)
    }

    // 如果返回的是base64，需要上传到Supabase Storage
    let finalImageUrl = imageUrl
    if (imageUrl.startsWith('data:image')) {
      // 处理base64图片，上传到Supabase Storage
      try {
        const base64Data = imageUrl.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `${storyId}-${Date.now()}.png`
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('story-images')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: false
          })

        if (!uploadError) {
          // 获取公开URL
          const { data: urlData } = supabaseAdmin.storage
            .from('story-images')
            .getPublicUrl(fileName)
          
          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl
          }
        }
      } catch {
        // 如果上传失败，使用base64（临时方案）
      }
    }

    // 更新故事记录，保存图片URL
    const { error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ image_url: finalImageUrl })
      .eq('id', storyId)

    if (updateError) {
      // 即使更新失败，也返回图片URL
      if (process.env.NODE_ENV === 'development') {
        console.error('更新故事图片失败:', updateError)
      }
    }

    return createSuccessResponse({ 
      imageUrl: finalImageUrl 
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

