import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'created_at' // created_at or likes
    const offset = (page - 1) * limit

    let query = supabase
      .from('stories')
      .select('id, words, content, likes, created_at, image_url', { count: 'exact' })

    // Add search filter
    if (search) {
      query = query.or(`words.ilike.%${search}%,content.ilike.%${search}%`)
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
      console.error('Fetch stories error:', error)
      return NextResponse.json(
        { error: '获取故事列表失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      stories: stories || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Get stories error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

