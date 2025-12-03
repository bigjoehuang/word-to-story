import { formatDate, isLiked } from '@/lib/utils'

describe('formatDate', () => {
  beforeEach(() => {
    // Mock localStorage
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should return "刚刚" for dates less than 1 minute ago', () => {
    const now = new Date()
    const date = new Date(now.getTime() - 30 * 1000) // 30 seconds ago
    expect(formatDate(date.toISOString())).toBe('刚刚')
  })

  it('should return minutes ago for dates less than 1 hour ago', () => {
    const now = new Date()
    const date = new Date(now.getTime() - 30 * 60 * 1000) // 30 minutes ago
    expect(formatDate(date.toISOString())).toBe('30分钟前')
  })

  it('should return hours ago for dates less than 24 hours ago', () => {
    const now = new Date()
    const date = new Date(now.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
    expect(formatDate(date.toISOString())).toBe('5小时前')
  })

  it('should return days ago for dates less than 7 days ago', () => {
    const now = new Date()
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    expect(formatDate(date.toISOString())).toBe('3天前')
  })

  it('should return formatted date for dates more than 7 days ago', () => {
    const date = new Date('2024-01-01')
    const result = formatDate(date.toISOString())
    expect(result).toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/)
  })
})

describe('isLiked', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should return false when localStorage is empty', () => {
    expect(isLiked('story-1')).toBe(false)
  })

  it('should return true when story is in liked stories', () => {
    localStorage.setItem('likedStories', JSON.stringify(['story-1', 'story-2']))
    expect(isLiked('story-1')).toBe(true)
  })

  it('should return false when story is not in liked stories', () => {
    localStorage.setItem('likedStories', JSON.stringify(['story-1', 'story-2']))
    expect(isLiked('story-3')).toBe(false)
  })

  it('should handle invalid JSON in localStorage', () => {
    localStorage.setItem('likedStories', 'invalid-json')
    // Should not throw, but return false
    expect(() => isLiked('story-1')).not.toThrow()
  })
})

