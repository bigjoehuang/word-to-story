/**
 * 设备UID管理
 * 为每个设备生成唯一的用户ID，存储在localStorage中
 * 不需要注册登录，基于设备的匿名用户体系
 */

const DEVICE_ID_KEY = 'device_user_id'

/**
 * 生成唯一的设备ID
 */
function generateDeviceId(): string {
  // 使用时间戳 + 随机数生成唯一ID
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `device_${timestamp}_${random}`
}

/**
 * 获取或创建设备ID
 * 如果localStorage中已有，则返回；否则创建新的并保存
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') {
    // 服务端环境，返回临时ID（实际不会在服务端使用）
    return 'server_temp_id'
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      // 首次访问，生成新的设备ID
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  } catch (error) {
    // localStorage不可用，使用sessionStorage或生成临时ID
    console.error('Failed to access localStorage:', error)
    try {
      let deviceId = sessionStorage.getItem(DEVICE_ID_KEY)
      if (!deviceId) {
        deviceId = generateDeviceId()
        sessionStorage.setItem(DEVICE_ID_KEY, deviceId)
      }
      return deviceId
    } catch {
      // 如果都不可用，返回基于时间的临时ID
      return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    }
  }
}

/**
 * 重置设备ID（用于测试或用户想要重新开始）
 */
export function resetDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server_temp_id'
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY)
    sessionStorage.removeItem(DEVICE_ID_KEY)
    return getDeviceId()
  } catch {
    return getDeviceId()
  }
}

