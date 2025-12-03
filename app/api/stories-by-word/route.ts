import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'
import type { StoriesByWordResponse } from '@/types/api'
import type { Story } from '@/types/story'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const word = searchParams.get('word')

    if (!word || word.trim().length === 0) {
      return createErrorResponse('请提供字参数', 400)
    }

    const trimmedWord = word.trim()

    // 获取该字的所有故事（包含作者昵称）
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, words, content, likes, created_at, image_url, author_nickname')
      .eq('words', trimmedWord)
      .order('created_at', { ascending: false })

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

