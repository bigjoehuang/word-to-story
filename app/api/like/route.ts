import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateUUID, handleDatabaseError } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  try {
    const { storyId } = await request.json()

    if (!validateUUID(storyId)) {
      return createErrorResponse('缺少或无效的故事ID', 400)
    }

    // Get existing story
    const { data: existingStory, error: fetchError } = await supabaseAdmin
      .from('stories')
      .select('likes')
      .eq('id', storyId)
      .single()

    if (fetchError || !existingStory) {
      return createErrorResponse('故事不存在', 404)
    }

    // Update likes count
    // Note: Duplicate prevention is handled on the client side using localStorage
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ 
        likes: (existingStory.likes || 0) + 1
      })
      .eq('id', storyId)
      .select('likes')
      .single()

    if (updateError) {
      return handleDatabaseError(updateError, '点赞失败')
    }

    return createSuccessResponse({ 
      likes: updatedStory.likes 
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

