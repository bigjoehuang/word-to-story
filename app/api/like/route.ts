import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { storyId } = await request.json()

    if (!storyId) {
      return NextResponse.json(
        { error: '缺少故事ID' },
        { status: 400 }
      )
    }

    // Get existing story
    const { data: existingStory } = await supabaseAdmin
      .from('stories')
      .select('likes')
      .eq('id', storyId)
      .single()

    if (!existingStory) {
      return NextResponse.json(
        { error: '故事不存在' },
        { status: 404 }
      )
    }

    // Update likes count
    // Note: Duplicate prevention is handled on the client side using localStorage
    const { data: updatedStory, error: updateError } = await supabaseAdmin
      .from('stories')
      .update({ 
        likes: (existingStory.likes || 0) + 1
      })
      .eq('id', storyId)
      .select()
      .single()

    if (updateError) {
      console.error('Update likes error:', updateError)
      return NextResponse.json(
        { error: '点赞失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      likes: updatedStory.likes 
    }, { status: 200 })
  } catch (error) {
    console.error('Like story error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

