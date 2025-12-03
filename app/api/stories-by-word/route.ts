import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const word = searchParams.get('word')

    if (!word) {
      return NextResponse.json(
        { error: '请提供字参数' },
        { status: 400 }
      )
    }

    // 获取该字的所有故事
    const { data: stories, error } = await supabase
      .from('stories')
      .select('id, words, content, likes, created_at, image_url')
      .eq('words', word.trim())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch stories by word error:', error)
      return NextResponse.json(
        { error: '获取故事失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      word: word.trim(),
      stories: stories || [],
      count: stories?.length || 0
    }, { status: 200 })
  } catch (error) {
    console.error('Get stories by word error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

