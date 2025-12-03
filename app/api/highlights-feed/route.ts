import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'

interface HighlightFeedItem {
  id: string
  story_id: string
  word: string
  text: string
  created_at: string
}

export async function GET(_request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .select('id, text_content, created_at, story_id, stories(words)')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return handleDatabaseError(error, '获取精彩划线失败')
    }

    const highlights: HighlightFeedItem[] =
      (data || [])
        .map((row: any) => {
          const word = row.stories?.words?.trim()
          if (!word) return null
          return {
            id: row.id as string,
            story_id: row.story_id as string,
            word,
            text: row.text_content as string,
            created_at: row.created_at as string,
          }
        })
        .filter((item: HighlightFeedItem | null): item is HighlightFeedItem => item !== null)

    const body = createSuccessResponse<{ highlights: HighlightFeedItem[] }>({
      highlights,
    })

    const res = NextResponse.json(body)

    res.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
    return res
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}


