import { getDeviceId } from './deviceId'

const NICKNAME_STORAGE_KEY = 'user_nickname'

// 简单有趣的昵称池
const NICKNAME_PREFIXES = [
  '发光的',
  '暴走的',
  '安静的',
  '爱笑的',
  '贪睡的',
  '神秘的',
  '宇宙级',
  '今天也很',
]

const NICKNAME_SUFFIXES = [
  '橘子猫',
  '代码骑士',
  '星球旅人',
  '读故事的人',
  '夜晚写手',
  '白日梦想家',
  '发呆专家',
  '小小宇航员',
]

export function getRandomNickname(): string {
  const prefix = NICKNAME_PREFIXES[Math.floor(Math.random() * NICKNAME_PREFIXES.length)]
  const suffix = NICKNAME_SUFFIXES[Math.floor(Math.random() * NICKNAME_SUFFIXES.length)]
  return `${prefix}${suffix}`
}

export function getStoredNickname(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const value = localStorage.getItem(NICKNAME_STORAGE_KEY)
    return value || null
  } catch {
    return null
  }
}

export function setStoredNickname(nickname: string) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(NICKNAME_STORAGE_KEY, nickname)
  } catch {
    // ignore
  }
}

// 简单缓存，避免重复请求同一设备的昵称
const nicknameCache = new Map<string, string>()

export async function fetchNicknameForDevice(deviceId: string): Promise<string | null> {
  if (!deviceId) return null
  if (nicknameCache.has(deviceId)) {
    return nicknameCache.get(deviceId) || null
  }

  try {
    const res = await fetch(`/api/profile?deviceId=${encodeURIComponent(deviceId)}`)
    const data = await res.json()
    if (res.ok && data.profile?.nickname) {
      nicknameCache.set(deviceId, data.profile.nickname)
      // 如果是当前设备，也同步到本地存储
      const currentId = typeof window !== 'undefined' ? getDeviceId() : null
      if (currentId && currentId === deviceId) {
        setStoredNickname(data.profile.nickname)
      }
      return data.profile.nickname as string
    }
  } catch {
    // ignore
  }
  return null
}

/**
 * 确保当前设备已有昵称：
 * - 先读 localStorage
 * - 再尝试从后端 profile 读取
 * - 都没有时，用 prompt 提示用户设置（给出随机建议）
 */
export async function ensureNickname(): Promise<string> {
  const deviceId = getDeviceId()

  // 1. 本地缓存
  const local = getStoredNickname()
  if (local) {
    nicknameCache.set(deviceId, local)
    return local
  }

  // 2. 后端 profile
  const remote = await fetchNicknameForDevice(deviceId)
  if (remote) {
    return remote
  }

  // 3. 提示用户设置昵称（仅在浏览器端）
  if (typeof window === 'undefined') {
    const fallback = getRandomNickname()
    nicknameCache.set(deviceId, fallback)
    return fallback
  }

  const suggestion = getRandomNickname()
  const input = window.prompt('给自己起一个好玩的昵称吧（后续会显示在创作人、想法列表中）：', suggestion) || suggestion
  const finalNickname = input.trim() || suggestion

  // 保存到后端
  try {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ deviceId, nickname: finalNickname }),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('保存昵称失败:', data.error)
    } else if (data.profile?.nickname) {
      nicknameCache.set(deviceId, data.profile.nickname)
      setStoredNickname(data.profile.nickname)
      return data.profile.nickname as string
    }
  } catch (e) {
    console.error('请求 /api/profile 失败:', e)
  }

  // 即使后端失败，本地也先用
  nicknameCache.set(deviceId, finalNickname)
  setStoredNickname(finalNickname)
  return finalNickname
}







