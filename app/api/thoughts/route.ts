import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateDeviceId, validateUUID, handleDatabaseError } from '@/lib/api-utils'
import { sanitizeThoughtContent, sanitizeAndValidate } from '@/lib/xss-protection'

// Save thought
export async function POST(request: NextRequest) {
  try {
    const { highlightId, storyId, content, deviceId } = await request.json()

    if (!validateUUID(highlightId) || !validateUUID(storyId)) {
      return createErrorResponse('缺少必要的参数', 400)
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('内容不能为空', 400)
    }

    // XSS 防护：清理和验证内容
    const sanitizedContent = sanitizeThoughtContent(content.trim())
    if (sanitizedContent.length === 0) {
      return createErrorResponse('内容包含无效字符', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('thoughts')
      .insert({
        highlight_id: highlightId,
        story_id: storyId,
        content: sanitizedContent,
        user_id: deviceId,
        ip_address: null
      })
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, '保存想法失败')
    }

    return createSuccessResponse({ thought: data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Get thoughts for a highlight or story
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const highlightId = searchParams.get('highlightId')
    const storyId = searchParams.get('storyId')

    if (!highlightId && !storyId) {
      return createErrorResponse('缺少 highlightId 或 storyId 参数', 400)
    }

    let query = supabaseAdmin
      .from('thoughts')
      .select('id, highlight_id, story_id, content, created_at, user_id')
      .order('created_at', { ascending: false })

    if (highlightId) {
      if (!validateUUID(highlightId)) {
        return createErrorResponse('无效的 highlightId 参数', 400)
      }
      query = query.eq('highlight_id', highlightId)
    } else if (storyId) {
      if (!validateUUID(storyId)) {
        return createErrorResponse('无效的 storyId 参数', 400)
      }
      query = query.eq('story_id', storyId)
    }

    const { data, error } = await query

    if (error) {
      return handleDatabaseError(error, '获取想法失败')
    }

    return createSuccessResponse({ thoughts: data || [] })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Update thought
export async function PUT(request: NextRequest) {
  try {
    const { thoughtId, content, deviceId } = await request.json()

    if (!validateUUID(thoughtId)) {
      return createErrorResponse('缺少或无效的 thoughtId 参数', 400)
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return createErrorResponse('内容不能为空', 400)
    }

    // XSS 防护：清理和验证内容
    const sanitizedContent = sanitizeThoughtContent(content.trim())
    if (sanitizedContent.length === 0) {
      return createErrorResponse('内容包含无效字符', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    // 首先检查想法是否存在，以及是否是当前用户创建的
    const { data: existingThought, error: fetchError } = await supabaseAdmin
      .from('thoughts')
      .select('user_id')
      .eq('id', thoughtId)
      .single()

    if (fetchError || !existingThought) {
      return createErrorResponse('想法不存在', 404)
    }

    // 检查是否是想法的主人
    if (existingThought.user_id !== deviceId) {
      return createErrorResponse('无权编辑此想法，只有创建者可以编辑', 403)
    }

    const { data, error } = await supabaseAdmin
      .from('thoughts')
      .update({ content: sanitizedContent })
      .eq('id', thoughtId)
      .eq('user_id', deviceId)
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, '更新想法失败')
    }

    return createSuccessResponse({ thought: data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Delete thought
export async function DELETE(request: NextRequest) {
  try {
    const { thoughtId, deviceId } = await request.json()

    if (!validateUUID(thoughtId)) {
      return createErrorResponse('缺少或无效的 thoughtId 参数', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    // 首先检查想法是否存在，以及是否是当前用户创建的
    const { data: thought, error: fetchError } = await supabaseAdmin
      .from('thoughts')
      .select('user_id')
      .eq('id', thoughtId)
      .single()

    if (fetchError || !thought) {
      return createErrorResponse('想法不存在', 404)
    }

    // 检查是否是想法的主人
    if (thought.user_id !== deviceId) {
      return createErrorResponse('无权删除此想法，只有创建者可以删除', 403)
    }

    // 删除想法
    const { error } = await supabaseAdmin
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)
      .eq('user_id', deviceId)

    if (error) {
      return handleDatabaseError(error, '删除想法失败')
    }

    return createSuccessResponse({})
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}
