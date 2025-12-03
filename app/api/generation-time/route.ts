import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createErrorResponse, createSuccessResponse, validateDeviceId, handleDatabaseError } from '@/lib/api-utils'

// Save generation time
export async function POST(request: NextRequest) {
  try {
    const { duration, deviceId } = await request.json()

    if (typeof duration !== 'number' || duration < 0 || !isFinite(duration)) {
      return createErrorResponse('无效的耗时数据', 400)
    }

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('generation_times')
      .insert({
        duration_ms: Math.round(duration),
        user_id: deviceId,
        ip_address: null
      })
      .select()
      .single()

    if (error) {
      return handleDatabaseError(error, '保存耗时记录失败')
    }

    return createSuccessResponse({ data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// Get generation times for statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    const { data, error } = await supabaseAdmin
      .from('generation_times')
      .select('id, duration_ms, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return handleDatabaseError(error, '获取耗时记录失败')
    }

    return createSuccessResponse({ 
      times: data || [],
      count: data?.length || 0
    })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

