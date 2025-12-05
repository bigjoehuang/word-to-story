import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'
import type { Pagination } from '@/types/api'
import type { Story } from '@/types/story'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const offset = (page - 1) * limit

    let query = supabase
      .from('stories')
      .select('id, words, content, likes, created_at, image_url, audio_url, character_name', { count: 'exact' })

    // Add search filter
    if (search.trim()) {
      query = query.or(`words.ilike.%${search.trim()}%,content.ilike.%${search.trim()}%`)
    }

    // Add sorting
    if (sortBy === 'likes') {
      query = query.order('likes', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: stories, error, count } = await query

    if (error) {
      return handleDatabaseError(error, '获取故事列表失败')
    }

    const total = count || 0

    return createSuccessResponse({
      stories: (stories as Story[]) || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      } as Pagination
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

