import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'
import type { WordCount } from '@/types/api'

export async function GET(_request: NextRequest) {
  try {
    const { data: stories, error } = await supabase
      .from('stories')
      .select('words')

    if (error) {
      return handleDatabaseError(error, '获取字列表失败')
    }

    // 按字分组统计
    const wordCounts = new Map<string, number>()
    stories?.forEach(story => {
      const word = story.words.trim()
      if (word) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    })

    // 转换为数组并按故事数量排序
    const wordsList: WordCount[] = Array.from(wordCounts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)

    return createSuccessResponse({
      words: wordsList,
      total: wordsList.length
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

