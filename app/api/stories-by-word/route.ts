import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'
import type { StoriesByWordResponse } from '@/types/api'
import type { Story } from '@/types/story'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const word = searchParams.get('word')
    const sortBy = searchParams.get('sortBy') || 'created_at'

    if (!word || word.trim().length === 0) {
      return createErrorResponse('请提供字参数', 400)
    }

    const trimmedWord = word.trim()

    // 构建查询
    let query = supabase
      .from('stories')
      .select('id, words, content, likes, created_at, image_url, audio_url, author_nickname, character_name')
      .eq('words', trimmedWord)

    // 添加排序
    if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'likes') {
      query = query.order('likes', { ascending: false })
    } else {
      // 默认按创建时间排序
      query = query.order('created_at', { ascending: false })
    }

    const { data: stories, error } = await query

    if (error) {
      return handleDatabaseError(error, '获取故事失败')
    }

    return createSuccessResponse<StoriesByWordResponse>({
      word: trimmedWord,
      stories: (stories as Story[]) || [],
      count: stories?.length || 0
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

