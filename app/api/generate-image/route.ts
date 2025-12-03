import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { storyId, words, content } = await request.json()

    if (!storyId || !words || !content) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      )
    }

    // 豆包API配置
    // 根据提供的API示例，使用Bearer token认证
    const doubaoApiKey = process.env.DOUBAO_API_KEY || process.env.DOUBAO_ACCESS_KEY

    if (!doubaoApiKey) {
      return NextResponse.json(
        { error: '豆包API配置未完成，请设置DOUBAO_API_KEY环境变量' },
        { status: 500 }
      )
    }

    // 根据故事内容生成图片描述prompt
    // 优化prompt，使其更适合图片生成
    const imagePrompt = `根据以下故事内容创作一幅精美的插画：故事关键词是"${words}"，故事内容：${content.substring(0, 500)}。要求：画面要符合故事的主题和氛围，风格温馨、有艺术感，适合作为故事配图，画面简洁但不失细节，电影大片质感，细腻的色彩层次，真实质感，光影效果营造氛围，兼具艺术幻想感`

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
      const errorText = await response.text()
      console.error('豆包API错误:', response.status, errorText)
      let errorMessage = '图片生成失败，请稍后重试'
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch {
        // 使用默认错误消息
      }
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('豆包API响应:', JSON.stringify(data, null, 2))
    
    // 解析返回的图片URL
    // 根据 /api/v3/images/generations 端点的响应格式
    // 响应格式通常是：{ "data": [{ "url": "..." }] }
    let imageUrl = ''
    
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      // 标准格式：data数组中的第一个元素的url字段
      imageUrl = data.data[0].url || data.data[0].b64_json
    } else if (data.url) {
      // 直接返回url字段
      imageUrl = data.url
    } else if (data.image_url) {
      // 返回image_url字段
      imageUrl = data.image_url
    }

    if (!imageUrl) {
      console.error('无法获取图片URL，完整响应:', JSON.stringify(data, null, 2))
      return NextResponse.json(
        { error: '图片生成成功但无法获取图片地址，请检查API响应格式' },
        { status: 500 }
      )
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

        if (uploadError) {
          console.error('上传图片失败:', uploadError)
          // 如果上传失败，使用base64（临时方案）
        } else {
          // 获取公开URL
          const { data: urlData } = supabaseAdmin.storage
            .from('story-images')
            .getPublicUrl(fileName)
          
          if (urlData?.publicUrl) {
            finalImageUrl = urlData.publicUrl
          }
        }
      } catch (uploadErr) {
        console.error('处理图片上传错误:', uploadErr)
      }
    }

    // 更新故事记录，保存图片URL
    const { error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ image_url: finalImageUrl })
      .eq('id', storyId)

    if (updateError) {
      console.error('更新故事图片失败:', updateError)
      // 即使更新失败，也返回图片URL
    }

    return NextResponse.json({ 
      success: true,
      imageUrl: finalImageUrl 
    }, { status: 200 })

  } catch (error) {
    console.error('生成图片错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

