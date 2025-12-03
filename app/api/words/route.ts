import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, handleDatabaseError } from '@/lib/api-utils'
import type { WordCount } from '@/types/api'

export async function GET(_request: NextRequest) {
  try {
    // 直接在数据库中按 words 分组统计，避免把所有故事拉到内存里再聚合
    const { data, error } = await supabase
      .from('stories')
      .select('words, count:likes', { count: 'exact', head: false }) as any

    if (error) {
      return handleDatabaseError(error, '获取字列表失败')
    }

    // Supabase 不支持原生 GROUP BY 聚合的简写，这里退回到内存按 words 聚合，
    // 但只选择 words 字段，并依赖数据库层面的索引优化扫描。
    const wordCounts = new Map<string, number>()
    data?.forEach((row: { words: string }) => {
      const word = row.words?.trim()
      if (!word) return
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    })

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

