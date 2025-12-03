import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Save highlight
export async function POST(request: NextRequest) {
  try {
    const { storyId, textContent, startIndex, endIndex, deviceId } = await request.json()

    if (!storyId || !textContent || typeof startIndex !== 'number' || typeof endIndex !== 'number') {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      )
    }

    if (startIndex < 0 || endIndex <= startIndex) {
      return NextResponse.json(
        { error: '无效的索引范围' },
        { status: 400 }
      )
    }

    // Validate device ID
    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json(
        { error: '缺少设备ID' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('highlights')
      .insert({
        story_id: storyId,
        text_content: textContent,
        start_index: startIndex,
        end_index: endIndex,
        user_id: deviceId,
        ip_address: null // 保留字段但不再使用
      })
      .select()
      .single()

    if (error) {
      console.error('Save highlight error:', error)
      return NextResponse.json(
        { error: '保存划线失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, highlight: data }, { status: 200 })
  } catch (error) {
    console.error('Save highlight error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Get highlights for a story
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const storyId = searchParams.get('storyId')

    if (!storyId) {
      return NextResponse.json(
        { error: '缺少 storyId 参数' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('highlights')
      .select('id, text_content, start_index, end_index, created_at, user_id')
      .eq('story_id', storyId)
      .order('start_index', { ascending: true })

    if (error) {
      console.error('Get highlights error:', error)
      return NextResponse.json(
        { error: '获取划线失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      highlights: data || []
    }, { status: 200 })
  } catch (error) {
    console.error('Get highlights error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Delete highlight
export async function DELETE(request: NextRequest) {
  try {
    const { highlightId, deviceId } = await request.json()

    if (!highlightId) {
      return NextResponse.json(
        { error: '缺少 highlightId 参数' },
        { status: 400 }
      )
    }

    if (!deviceId || typeof deviceId !== 'string') {
      return NextResponse.json(
        { error: '缺少设备ID' },
        { status: 400 }
      )
    }

    // 首先检查划线是否存在，以及是否是当前用户创建的
    const { data: highlight, error: fetchError } = await supabaseAdmin
      .from('highlights')
      .select('user_id')
      .eq('id', highlightId)
      .single()

    if (fetchError || !highlight) {
      return NextResponse.json(
        { error: '划线不存在' },
        { status: 404 }
      )
    }

    // 检查是否是划线的主人
    if (highlight.user_id !== deviceId) {
      return NextResponse.json(
        { error: '无权删除此划线，只有创建者可以删除' },
        { status: 403 }
      )
    }

    // 删除划线
    const { error } = await supabaseAdmin
      .from('highlights')
      .delete()
      .eq('id', highlightId)
      .eq('user_id', deviceId) // 双重检查，确保只能删除自己的

    if (error) {
      console.error('Delete highlight error:', error)
      return NextResponse.json(
        { error: '删除划线失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete highlight error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

