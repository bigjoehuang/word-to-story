import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               request.ip ||
               'unknown'

    // Calculate today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Count stories created today by this IP
    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    if (countError) {
      console.error('Count stories error:', countError)
      return NextResponse.json(
        { error: '获取剩余次数失败' },
        { status: 500 }
      )
    }

    const dailyLimit = 5
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

