import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 获取所有故事并按字分组统计
    const { data: stories, error } = await supabase
      .from('stories')
      .select('words')

    if (error) {
      console.error('Fetch words error:', error)
      return NextResponse.json(
        { error: '获取字列表失败' },
        { status: 500 }
      )
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
    const wordsList = Array.from(wordCounts.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count) // 按数量降序

    return NextResponse.json({
      words: wordsList,
      total: wordsList.length
    }, { status: 200 })
  } catch (error) {
    console.error('Get words error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

