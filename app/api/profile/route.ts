import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { 
  createErrorResponse, 
  createSuccessResponse, 
  validateDeviceId, 
  handleDatabaseError 
} from '@/lib/api-utils'
import { sanitizeNickname } from '@/lib/xss-protection'

// GET /api/profile?deviceId=xxx  获取昵称
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceId = searchParams.get('deviceId')

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, nickname')
      .eq('id', deviceId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116: row not found
      return handleDatabaseError(error, '获取昵称失败')
    }

    if (!data) {
      // 未设置昵称时返回 404，前端可以据此触发设置流程
      return createErrorResponse('未设置昵称', 404)
    }

    return createSuccessResponse({ profile: data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}

// POST /api/profile  设置或更新昵称
export async function POST(request: NextRequest) {
  try {
    const { deviceId, nickname } = await request.json()

    if (!validateDeviceId(deviceId)) {
      return createErrorResponse('缺少设备ID', 400)
    }

    if (!nickname || typeof nickname !== 'string') {
      return createErrorResponse('昵称不能为空', 400)
    }

    const sanitized = sanitizeNickname(nickname.trim())
    if (sanitized.length === 0) {
      return createErrorResponse('昵称包含无效字符', 400)
    }

    if (sanitized.length > 20) {
      return createErrorResponse('昵称长度不能超过20个字符', 400)
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: deviceId, nickname: sanitized },
        { onConflict: 'id' }
      )
      .select('id, nickname')
      .single()

    if (error) {
      return handleDatabaseError(error, '保存昵称失败')
    }

    return createSuccessResponse({ profile: data })
  } catch (error) {
    return handleDatabaseError(error, '服务器错误')
  }
}







