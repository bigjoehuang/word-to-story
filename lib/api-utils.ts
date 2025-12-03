/**
 * API 工具函数
 * 统一错误处理和响应格式
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  [key: string]: any
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  additionalData?: Record<string, any>
): NextResponse<ApiError> {
  return NextResponse.json(
    { error, ...additionalData },
    { status }
  )
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<{ success: true } & T> {
  return NextResponse.json(
    { success: true, ...data } as { success: true } & T,
    { status }
  )
}

/**
 * 验证设备ID
 */
export function validateDeviceId(deviceId: any): deviceId is string {
  return typeof deviceId === 'string' && deviceId.length > 0
}

/**
 * 验证UUID格式
 */
export function validateUUID(id: any): id is string {
  if (typeof id !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * 获取每日限制（从环境变量）
 */
export function getDailyLimit(): number {
  return parseInt(process.env.DAILY_STORY_LIMIT || '5', 10)
}

/**
 * 获取今天的日期范围
 */
export function getTodayDateRange(): { start: string; end: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return {
    start: today.toISOString(),
    end: tomorrow.toISOString()
  }
}

/**
 * 处理数据库错误
 */
export function handleDatabaseError(error: any, defaultMessage: string = '数据库操作失败'): NextResponse<ApiError> {
  if (process.env.NODE_ENV === 'development') {
    console.error('Database error:', error)
  }
  return createErrorResponse(defaultMessage, 500)
}

/**
 * 处理外部API错误
 */
export function handleExternalApiError(
  error: any,
  apiName: string = '外部API',
  defaultMessage: string = 'API调用失败'
): NextResponse<ApiError> {
  if (process.env.NODE_ENV === 'development') {
    console.error(`${apiName} error:`, error)
  }
  
  let errorMessage = defaultMessage
  
  if (error?.message) {
    if (error.message.includes('Insufficient Balance') || error.message.includes('余额不足')) {
      errorMessage = `${apiName} 余额不足，请充值后重试`
    } else if (error.message.includes('Invalid API key') || error.message.includes('API key')) {
      errorMessage = `${apiName} Key 无效，请检查配置`
    } else {
      errorMessage = `${apiName} 错误: ${error.message}`
    }
  }
  
  return createErrorResponse(errorMessage, 500)
}

