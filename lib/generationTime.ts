// 管理创作耗时统计（使用数据库）

export interface GenerationTimeRecord {
  id: string
  duration_ms: number
  created_at: string
}

const DEFAULT_ESTIMATED_TIME = 30000 // 默认30秒
const DEFAULT_MAX_TIME = 60000 // 默认60秒

/**
 * 保存创作耗时记录到数据库
 */
export async function saveGenerationTime(duration: number): Promise<void> {
  try {
    const response = await fetch('/api/generation-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ duration }),
    })

    if (!response.ok) {
      console.error('Failed to save generation time to database')
    }
  } catch (error) {
    console.error('Failed to save generation time:', error)
  }
}

/**
 * 从数据库获取所有创作耗时记录
 */
export async function getGenerationTimes(): Promise<GenerationTimeRecord[]> {
  try {
    const response = await fetch('/api/generation-time?limit=20')
    const data = await response.json()
    
    if (response.ok && data.times) {
      return data.times
    }
    return []
  } catch (error) {
    console.error('Failed to get generation times:', error)
    return []
  }
}

/**
 * 计算平均耗时（毫秒）
 */
export async function getAverageGenerationTime(): Promise<number> {
  const records = await getGenerationTimes()
  if (records.length === 0) return DEFAULT_ESTIMATED_TIME

  const total = records.reduce((sum, record) => sum + record.duration_ms, 0)
  return Math.round(total / records.length)
}

/**
 * 计算预估耗时（使用加权平均，最近的记录权重更高）
 */
export async function getEstimatedGenerationTime(): Promise<number> {
  const records = await getGenerationTimes()
  if (records.length === 0) return DEFAULT_ESTIMATED_TIME

  // 使用加权平均，最近的记录权重更高
  let totalWeight = 0
  let weightedSum = 0

  records.forEach((record, index) => {
    const weight = records.length - index // 越新的记录权重越高
    weightedSum += record.duration_ms * weight
    totalWeight += weight
  })

  return Math.round(weightedSum / totalWeight)
}

/**
 * 获取最大耗时（用于进度条上限）
 */
export async function getMaxGenerationTime(): Promise<number> {
  const records = await getGenerationTimes()
  if (records.length === 0) return DEFAULT_MAX_TIME

  const maxTime = Math.max(...records.map(r => r.duration_ms))
  // 增加20%的缓冲时间
  return Math.round(maxTime * 1.2)
}
