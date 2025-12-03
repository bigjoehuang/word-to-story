/**
 * API 速率限制工具
 * 防止 API 滥用和 DDoS 攻击
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
  message?: string // 错误消息
  skipSuccessfulRequests?: boolean // 是否跳过成功请求
  skipFailedRequests?: boolean // 是否跳过失败请求
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

/**
 * 获取客户端标识符（设备ID或IP地址）
 */
export function getClientIdentifier(request: NextRequest, deviceId?: string): string {
  // 优先使用设备ID
  if (deviceId && deviceId.length > 0) {
    return `device:${deviceId}`
  }
  
  // 回退到IP地址
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}

/**
 * 检查速率限制（基于内存的简单实现）
 * 注意：在生产环境中，应该使用 Redis 等外部存储
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now()
  const key = identifier
  const windowStart = now - config.windowMs

  // 清理过期记录
  if (rateLimitStore.has(key)) {
    const record = rateLimitStore.get(key)!
    if (record.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }

  // 获取或创建记录
  let record = rateLimitStore.get(key)
  
  if (!record || record.resetTime < now) {
    // 创建新记录
    record = {
      count: 0,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, record)
  }

  // 检查是否超过限制
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter
    }
  }

  // 增加计数
  record.count++

  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * 基于数据库的速率限制（更可靠，适合生产环境）
 */
export async function checkRateLimitDB(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  try {
    // 查询时间窗口内的请求数
    const { count, error } = await supabaseAdmin
      .from('api_rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .gte('created_at', windowStart.toISOString())

    if (error) {
      // 如果查询失败，为了安全起见，允许请求但记录错误
      console.error('Rate limit check error:', error)
      return {
        allowed: true,
        remaining: config.maxRequests,
        resetTime: Date.now() + config.windowMs
      }
    }

    const requestCount = count || 0

    if (requestCount >= config.maxRequests) {
      // 计算重置时间
      const oldestRequest = await supabaseAdmin
        .from('api_rate_limits')
        .select('created_at')
        .eq('identifier', identifier)
        .gte('created_at', windowStart.toISOString())
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      let resetTime = Date.now() + config.windowMs
      if (oldestRequest.data) {
        const oldestTime = new Date(oldestRequest.data.created_at).getTime()
        resetTime = oldestTime + config.windowMs
      }

      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter
      }
    }

    // 记录本次请求
    await supabaseAdmin
      .from('api_rate_limits')
      .insert({
        identifier,
        created_at: now.toISOString()
      })

    // 清理过期记录（异步，不阻塞）
    supabaseAdmin
      .from('api_rate_limits')
      .delete()
      .lt('created_at', windowStart.toISOString())
      .then(() => {}) // 忽略错误

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount - 1,
      resetTime: Date.now() + config.windowMs
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // 出错时允许请求，但记录错误
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs
    }
  }
}

/**
 * 创建速率限制响应
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  message: string = '请求过于频繁，请稍后再试'
): NextResponse {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', '0')
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
  
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString())
  }

  return NextResponse.json(
    { 
      error: message,
      retryAfter: result.retryAfter
    },
    { 
      status: 429,
      headers
    }
  )
}

/**
 * 预设的速率限制配置
 */
export const RATE_LIMIT_CONFIGS = {
  // 生成故事：每小时 10 次（除了每日限制）
  GENERATE_STORY: {
    windowMs: 60 * 60 * 1000, // 1 小时
    maxRequests: 10,
    message: '请求过于频繁，请稍后再试'
  },
  
  // 生成图片：每小时 20 次
  GENERATE_IMAGE: {
    windowMs: 60 * 60 * 1000, // 1 小时
    maxRequests: 20,
    message: '图片生成请求过于频繁，请稍后再试'
  },
  
  // 高亮操作：每分钟 30 次
  HIGHLIGHT: {
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 30,
    message: '高亮操作过于频繁，请稍后再试'
  },
  
  // 想法操作：每分钟 20 次
  THOUGHT: {
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 20,
    message: '想法操作过于频繁，请稍后再试'
  },
  
  // 点赞操作：每分钟 50 次
  LIKE: {
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 50,
    message: '点赞操作过于频繁，请稍后再试'
  },
  
  // 通用 API：每分钟 60 次
  GENERAL: {
    windowMs: 60 * 1000, // 1 分钟
    maxRequests: 60,
    message: '请求过于频繁，请稍后再试'
  }
}

/**
 * 检查请求体大小
 */
export function checkRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length')
  if (contentLength) {
    const size = parseInt(contentLength, 10)
    return size <= maxSize
  }
  return true // 如果没有 Content-Length，允许请求（由服务器处理）
}

/**
 * 获取请求体大小限制配置
 */
export function getRequestSizeLimit(endpoint: string): number {
  const limits: Record<string, number> = {
    '/api/generate': 1024, // 1KB（只有 words 参数）
    '/api/generate-image': 10 * 1024, // 10KB
    '/api/highlights': 5 * 1024, // 5KB
    '/api/thoughts': 5 * 1024, // 5KB
    '/api/like': 512, // 512B
    '/api/generation-time': 512, // 512B
  }
  
  return limits[endpoint] || 1024 * 1024 // 默认 1MB
}

