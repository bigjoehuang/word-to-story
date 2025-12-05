import { NextRequest } from 'next/server'
import { createSuccessResponse } from '@/lib/api-utils'

/**
 * 检查音频API是否已配置
 */
export async function GET(_request: NextRequest) {
  // 首先检查是否启用了播客功能
  const enablePodcast = process.env.ENABLE_PODCAST_AUDIO === 'true' || 
                       process.env.NEXT_PUBLIC_ENABLE_PODCAST_AUDIO === 'true'
  
  if (!enablePodcast) {
    return createSuccessResponse({
      available: false,
      message: '播客功能已禁用，设置 ENABLE_PODCAST_AUDIO=true 启用'
    })
  }

  const volcengineAppId = process.env.VOLCENGINE_APP_ID
  const volcengineAccessToken = process.env.VOLCENGINE_ACCESS_TOKEN

  // 检查API是否已配置（更严格的检查）
  // 只有当两个值都存在且不是占位符时才认为已配置
  const hasAppId = volcengineAppId && 
                   typeof volcengineAppId === 'string' && 
                   volcengineAppId.trim().length > 0 &&
                   !volcengineAppId.includes('your_volcengine') &&
                   volcengineAppId !== 'your_volcengine_app_id'
  
  const hasAccessToken = volcengineAccessToken && 
                        typeof volcengineAccessToken === 'string' && 
                        volcengineAccessToken.trim().length > 0 &&
                        !volcengineAccessToken.includes('your_volcengine') &&
                        volcengineAccessToken !== 'your_volcengine_access_token'
  
  const isConfigured = hasAppId && hasAccessToken

  // 开发环境下记录检查结果
  if (process.env.NODE_ENV === 'development') {
    console.log('[Audio API Check]', {
      enablePodcast,
      hasAppId,
      hasAccessToken,
      isConfigured,
      appIdLength: volcengineAppId?.length || 0,
      tokenLength: volcengineAccessToken?.length || 0
    })
  }

  return createSuccessResponse({
    available: isConfigured,
    message: isConfigured 
      ? '音频API已配置' 
      : '音频API未配置，请在火山引擎控制台开通"语音播客大模型"服务并配置环境变量'
  })
}

