import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateDeviceId, validateUUID, handleDatabaseError } from '@/lib/api-utils'
import { sanitizeHighlightText, sanitizeAndValidate } from '@/lib/xss-protection'
import { 
  getClientIdentifier, 
  checkRateLimitDB, 
  createRateLimitResponse,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit
} from '@/lib/rate-limit'

// Save highlight
export async function POST(request: NextRequest) {
  try {
    // 检查请求体大小
    const maxSize = getRequestSizeLimit('/api/highlights')
    if (!checkRequestSize(request, maxSize)) {
      return createErrorResponse('请求体过大', 413)
    }

    const { storyId, textContent, startIndex, endIndex, deviceId } = await request.json()

    // 速率限制检查
    const identifier = getClientIdentifier(request, deviceId)
    const rateLimitResult = await checkRateLimitDB(
      identifier,
      RATE_LIMIT_CONFIGS.HIGHLIGHT
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, RATE_LIMIT_CONFIGS.HIGHLIGHT.message)
    }

    if (!validateUUID(storyId)) {
      return createErrorResponse('无效的故事ID', 400)
    }

    if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
      return createErrorResponse('文本内容不能为空', 400)
    }

    // XSS 防护：清理和验证文本内容
    const sanitizedText = sanitizeHighlightText(textContent.trim())
    if (sanitizedText.length === 0) {
      return createErrorResponse('文本内容包含无效字符', 400)
    }

    if (typeof startIndex !== 'number' || typeof endIndex !== 'number') {
      return createErrorResponse('缺少必要的参数', 400)
    }

    if (startIndex < 0 || endIndex <= startIndex) {
      return createErrorResponse('无效的索引范围', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('highlights')
      .insert({
        story_id: storyId,
        text_content: sanitizedText,
        start_index: startIndex,
        end_index: endIndex,
        user_id: deviceId,
        ip_address: null
      })
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, '保存划线失败')
    }

    return createSuccessResponse({ highlight: data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Get highlights for a story
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storyId = searchParams.get('storyId')

    if (!validateUUID(storyId)) {
      return createErrorResponse('缺少或无效的 storyId 参数', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('highlights')
      .select('id, text_content, start_index, end_index, created_at, user_id')
      .eq('story_id', storyId)
      .order('start_index', { ascending: true })

    if (error) {
      return handleDatabaseError(error, '获取划线失败')
    }

    return createSuccessResponse({ highlights: data || [] })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Delete highlight
export async function DELETE(request: NextRequest) {
  try {
    const { highlightId, deviceId } = await request.json()

    if (!validateUUID(highlightId)) {
      return createErrorResponse('缺少或无效的 highlightId 参数', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    // 首先检查划线是否存在，以及是否是当前用户创建的
    const { data: highlight, error: fetchError } = await supabaseAdmin
      .from('highlights')
      .select('user_id')
      .eq('id', highlightId)
      .single()

    if (fetchError || !highlight) {
      return createErrorResponse('划线不存在', 404)
    }

    // 检查是否是划线的主人
    if (highlight.user_id !== deviceId) {
      return createErrorResponse('无权删除此划线，只有创建者可以删除', 403)
    }

    // 删除划线
    const { error } = await supabaseAdmin
      .from('highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', deviceId)

    if (error) {
      return handleDatabaseError(error, '删除划线失败')
    }

    return createSuccessResponse({})
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

