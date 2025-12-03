import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Save thought
export async function POST(request: NextRequest) {
  try {
    const { highlightId, storyId, content } = await request.json()

    if (!highlightId || !storyId || !content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: '缺少必要的参数或内容为空' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    const { data, error } = await supabaseAdmin
      .from('thoughts')
      .insert({
        highlight_id: highlightId,
        story_id: storyId,
        content: content.trim(),
        ip_address: ip
      })
      .select()
      .single()

    if (error) {
      console.error('Save thought error:', error)
      return NextResponse.json(
        { error: '保存想法失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, thought: data }, { status: 200 })
  } catch (error) {
    console.error('Save thought error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Get thoughts for a highlight or story
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const highlightId = searchParams.get('highlightId')
    const storyId = searchParams.get('storyId')

    if (!highlightId && !storyId) {
      return NextResponse.json(
        { error: '缺少 highlightId 或 storyId 参数' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('thoughts')
      .select('id, highlight_id, story_id, content, created_at')
      .order('created_at', { ascending: false })

    if (highlightId) {
      query = query.eq('highlight_id', highlightId)
    } else if (storyId) {
      query = query.eq('story_id', storyId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get thoughts error:', error)
      return NextResponse.json(
        { error: '获取想法失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      thoughts: data || []
    }, { status: 200 })
  } catch (error) {
    console.error('Get thoughts error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Update thought
export async function PUT(request: NextRequest) {
  try {
    const { thoughtId, content } = await request.json()

    if (!thoughtId || !content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: '缺少必要的参数或内容为空' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('thoughts')
      .update({ content: content.trim() })
      .eq('id', thoughtId)
      .select()
      .single()

    if (error) {
      console.error('Update thought error:', error)
      return NextResponse.json(
        { error: '更新想法失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, thought: data }, { status: 200 })
  } catch (error) {
    console.error('Update thought error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Delete thought
export async function DELETE(request: NextRequest) {
  try {
    const { thoughtId } = await request.json()

    if (!thoughtId) {
      return NextResponse.json(
        { error: '缺少 thoughtId 参数' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('thoughts')
      .delete()
      .eq('id', thoughtId)

    if (error) {
      console.error('Delete thought error:', error)
      return NextResponse.json(
        { error: '删除想法失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete thought error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

