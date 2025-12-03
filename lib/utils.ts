export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

export function isLiked(storyId: string): boolean {
  if (typeof window === 'undefined') return false
  const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
  return likedStories.includes(storyId)
}

// 判断当前设备是否已将某个故事标记为“读完”
export function isRead(storyId: string): boolean {
  if (typeof window === 'undefined') return false
  const readStories = JSON.parse(localStorage.getItem('readStories') || '[]')
  return readStories.includes(storyId)
}

// 将某个故事标记为“读完”（仅本设备）
export function markRead(storyId: string) {
  if (typeof window === 'undefined') return
  const readStories = JSON.parse(localStorage.getItem('readStories') || '[]')
  if (!readStories.includes(storyId)) {
    localStorage.setItem('readStories', JSON.stringify([...readStories, storyId]))
  }
}


