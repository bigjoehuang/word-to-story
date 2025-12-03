import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateDeviceId, validateUUID, handleDatabaseError } from '@/lib/api-utils'
import { 
  getClientIdentifier, 
  checkRateLimitDB, 
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit
} from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // 检查请求体大小
    const maxSize = getRequestSizeLimit('/api/like')
    if (!checkRequestSize(request, maxSize)) {
      return createErrorResponse('请求体过大', 413)
    }

    const { storyId, deviceId } = await request.json()

    // 速率限制检查（基于设备ID/IP）
    const identifier = getClientIdentifier(request, deviceId)
    const rateLimitResult = await checkRateLimitDB(
      identifier,
      RATE_LIMIT_CONFIGS.LIKE
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_CONFIGS.LIKE.message)
    }

    if (!validateUUID(storyId)) {
      return createErrorResponse('缺少或无效的故事ID', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    // 1. 先尝试插入一条 story_likes 记录（依赖 UNIQUE(story_id, user_id) 保证幂等）
    const { error: likeInsertError } = await supabaseAdmin
      .from('story_likes')
      .insert({
        story_id: storyId,
        user_id: deviceId,
      })

    // 如果违反唯一约束，说明这个设备已经点过赞了，直接返回当前 likes 值，不再重复加一
    if (likeInsertError?.code === '23505') {
      const { data: existingStory, error: fetchError } = await supabaseAdmin
        .from('stories')
        .select('likes')
        .eq('id', storyId)
        .single()

      if (fetchError || !existingStory) {
        return createErrorResponse('故事不存在', 404)
      }

      return createSuccessResponse({
        likes: existingStory.likes || 0,
      })
    }

    if (likeInsertError) {
      return handleDatabaseError(likeInsertError, '点赞失败')
    }

    // 2. 只有在成功写入 story_likes 时，才对 stories.likes +1，保证数字准确
    const { data: existingStory, error: fetchError } = await supabaseAdmin
      .from('stories')
      .select('likes')
      .eq('id', storyId)
      .single()

    if (fetchError || !existingStory) {
      return createErrorResponse('故事不存在', 404)
    }

    const currentLikes = existingStory.likes || 0

    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from('stories')
      .update({
        likes: currentLikes + 1,
      })
      .eq('id', storyId)
      .select('likes')
      .single()

    if (updateError || !updatedStory) {
      return handleDatabaseError(updateError, '点赞失败')
    }

    return createSuccessResponse({
      likes: updatedStory.likes,
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

