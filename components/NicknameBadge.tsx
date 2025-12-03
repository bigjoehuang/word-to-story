'use client'

import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { ensureNickname, getStoredNickname } from '@/lib/nickname'
import { getDeviceId } from '@/lib/deviceId'

export default function NicknameBadge() {
  const [nickname, setNickname] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadNickname = async () => {
      try {
        // 先尝试本地存储，避免每次都弹窗
        const local = getStoredNickname()
        if (local) {
          // 确保后端 profiles 表也有这条记录（兼容老用户本地已有昵称但表里还没有的情况）
          const deviceId = getDeviceId()
          if (deviceId) {
            ;(async () => {
              try {
                await fetch('/api/profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ deviceId, nickname: local }),
                })
              } catch {
                // 同步失败忽略，不影响前端显示
              }
            })()
          }

          if (!isMounted) return
          setNickname(local)
          setLoading(false)
          return
        }

        // 确保当前设备有昵称（必要时会弹出一次设置框）
        const name = await ensureNickname()
        if (!isMounted) return
        setNickname(name)
      } catch {
        // 忽略错误，不阻塞主流程
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadNickname()

    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
        <User className="w-4 h-4" />
        <span>加载昵称中...</span>
      </div>
    )
  }

  if (!nickname) {
    return null
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm text-gray-700 dark:text-gray-200 shadow-sm">
      <User className="w-4 h-4 text-blue-500" />
      <span className="max-w-[140px] truncate">我是：{nickname}</span>
    </div>
  )
}


