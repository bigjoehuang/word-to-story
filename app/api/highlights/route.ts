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

    // Get device user ID from request body
    const { deviceId } = await request.json()
    
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
      .select('id, text_content, start_index, end_index, created_at')
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
    const { highlightId } = await request.json()

    if (!highlightId) {
      return NextResponse.json(
        { error: '缺少 highlightId 参数' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('highlights')
      .delete()
      .eq('id', highlightId)

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

