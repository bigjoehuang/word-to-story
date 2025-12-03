import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Save generation time
export async function POST(request: NextRequest) {
  try {
    const { duration } = await request.json()

    if (!duration || typeof duration !== 'number' || duration < 0) {
      return NextResponse.json(
        { error: '无效的耗时数据' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    const { data, error } = await supabaseAdmin
      .from('generation_times')
      .insert({
        duration_ms: Math.round(duration),
        ip_address: ip
      })
      .select()
      .single()

    if (error) {
      console.error('Save generation time error:', error)
      return NextResponse.json(
        { error: '保存耗时记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error) {
    console.error('Save generation time error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// Get generation times for statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')

    const { data, error } = await supabaseAdmin
      .from('generation_times')
      .select('id, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Get generation times error:', error)
      return NextResponse.json(
        { error: '获取耗时记录失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      times: data || [],
      count: data?.length || 0
    }, { status: 200 })
  } catch (error) {
    console.error('Get generation times error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

