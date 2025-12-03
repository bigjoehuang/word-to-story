import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateDeviceId, getDailyLimit, getTodayDateRange, handleDatabaseError } from '@/lib/api-utils'
import type { DailyLimitResponse } from '@/types/api'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('deviceId')

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    const { start, end } = getTodayDateRange()

    // Count stories created today by this user
    const { count, error: countError } = await supabaseAdmin
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', deviceId)
      .gte('created_at', start)
      .lt('created_at', end)

    if (countError) {
      return handleDatabaseError(countError, '获取剩余次数失败')
    }

    const dailyLimit = getDailyLimit()
    const used = count || 0
    const remaining = Math.max(0, dailyLimit - used)

    return createSuccessResponse<DailyLimitResponse>({
      limit: dailyLimit,
      used,
      remaining
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

