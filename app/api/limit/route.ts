import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get device user ID from query parameter
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json(
        { error: '缺少设备ID' },
        { status: 400 }
      )
    }

    // Calculate today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Count stories created today by this user
    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', deviceId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (countError) {
      console.error('Count stories error:', countError)
      return NextResponse.json(
        { error: '获取剩余次数失败' },
        { status: 500 }
      )
    }

    // 从环境变量获取每日限制，默认为 5
    const dailyLimit = parseInt(process.env.DAILY_STORY_LIMIT || '5', 10)
    const used = count || 0
    const remaining = Math.max(0, dailyLimit - used)

    return NextResponse.json({
      limit: dailyLimit,
      used,
      remaining
    }, { status: 200 })
  } catch (error) {
    console.error('Get limit error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

