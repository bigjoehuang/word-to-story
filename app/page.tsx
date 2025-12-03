'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InfiniteScroll from 'react-infinite-scroll-component'
import { 
  Heart, 
  Search, 
  Sparkles, 
  Clock, 
  TrendingUp,
  Loader2,
  X
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import StorySkeleton from '@/components/StorySkeleton'

interface Story {
  id: string
  words: string
  content: string
  likes: number
  created_at: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function Home() {
  const [words, setWords] = useState('')
  const [loading, setLoading] = useState(false)
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [error, setError] = useState('')
  const [dailyLimit, setDailyLimit] = useState({ limit: 5, used: 0, remaining: 5 })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'created_at' | 'likes'>('created_at')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  // Fetch stories with search and pagination
  const fetchStories = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: sortBy,
        ...(searchQuery && { search: searchQuery })
      })

      const response = await fetch(`/api/stories?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        if (reset) {
          setStories(data.stories)
          setPage(2)
        } else {
          setStories(prev => [...prev, ...data.stories])
          setPage(prev => prev + 1)
        }
        setPagination(data.pagination)
        setHasMore(data.pagination.page < data.pagination.totalPages)
      } else {
        setError(data.error || '获取故事失败')
      }
    } catch (err) {
      setError('网络错误')
    } finally {
      setLoadingStories(false)
    }
  }, [page, sortBy, searchQuery])

  // Fetch stories on mount and when filters change
  useEffect(() => {
    setLoadingStories(true)
    setPage(1)
    fetchStories(true)
  }, [sortBy, searchQuery])

  // Fetch daily limit
  useEffect(() => {
    const fetchDailyLimit = async () => {
      try {
        const response = await fetch('/api/limit')
        const data = await response.json()
        if (response.ok) {
          setDailyLimit(data)
        }
      } catch (err) {
        // Silently fail
      }
    }
    fetchDailyLimit()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedWords = words.trim()
    if (trimmedWords.length === 0 || trimmedWords.length > 3) {
      setError('请输入1-3个字')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: trimmedWords }),
      })

      const data = await response.json()

      if (response.ok) {
        setStories(prev => [data.story, ...prev])
        setWords('')
        // Refresh daily limit
        const limitResponse = await fetch('/api/limit')
        const limitData = await limitResponse.json()
        if (limitResponse.ok) {
          setDailyLimit(limitData)
        }
      } else {
        if (response.status === 429) {
          setError(data.error || '今日创作次数已达上限')
          const limitResponse = await fetch('/api/limit')
          const limitData = await limitResponse.json()
          if (limitResponse.ok) {
            setDailyLimit(limitData)
          }
        } else {
          setError(data.error || '生成故事失败')
        }
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async (storyId: string, currentLikes: number) => {
    const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
    if (likedStories.includes(storyId)) {
      return
    }

    // Optimistic update
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, likes: currentLikes + 1 }
        : story
    ))

    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('likedStories', JSON.stringify([...likedStories, storyId]))
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: data.likes }
            : story
        ))
      } else {
        // Revert on error
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: currentLikes }
            : story
        ))
      }
    } catch (err) {
      // Revert on error
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likes: currentLikes }
          : story
      ))
    }
  }

  const isLiked = (storyId: string) => {
    if (typeof window === 'undefined') return false
    const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
    return likedStories.includes(storyId)
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.header 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            字成故事
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            输入1-3个字，AI为你创作一个有趣又引人思考的故事
          </p>
        </motion.header>

        {/* Input Form */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Daily Limit Display */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">今日剩余创作次数</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {dailyLimit.remaining} / {dailyLimit.limit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">已使用</p>
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{dailyLimit.used} 次</p>
              </div>
            </div>
            {dailyLimit.remaining === 0 && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">今日创作次数已用完，请明天再试</p>
            )}
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="words" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                输入1-3个字
              </label>
              <div className="relative">
                <input
                  id="words"
                  type="text"
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  maxLength={3}
                  placeholder="例如：梦想、勇气、爱"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  disabled={loading}
                />
                {words.length > 0 && (
                  <motion.button
                    type="button"
                    onClick={() => setWords('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                已输入 {words.length} / 3 个字
              </p>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading || words.trim().length === 0 || dailyLimit.remaining === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在生成故事...
                </>
              ) : dailyLimit.remaining === 0 ? (
                '今日创作次数已用完'
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成故事
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Search and Sort */}
        <motion.div 
          className="mb-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索故事..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            {/* Sort */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('created_at')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  sortBy === 'created_at'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600'
                }`}
              >
                <Clock className="w-4 h-4" />
                最新
              </button>
              <button
                onClick={() => setSortBy('likes')}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                  sortBy === 'likes'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                热门
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stories List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            故事列表
            {pagination && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({pagination.total} 个故事)
              </span>
            )}
          </h2>
          
          {loadingStories && stories.length === 0 ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <StorySkeleton key={i} />
              ))}
            </div>
          ) : stories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchQuery ? '没有找到相关故事' : '还没有故事，快来创作第一个吧！'}
              </p>
            </motion.div>
          ) : (
            <InfiniteScroll
              dataLength={stories.length}
              next={() => fetchStories()}
              hasMore={hasMore}
              loader={
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              }
              endMessage={
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  没有更多故事了
                </p>
              }
            >
              <AnimatePresence>
                {stories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 text-blue-800 dark:text-blue-300 font-semibold px-4 py-1 rounded-full text-sm mb-2">
                          {story.words}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(story.created_at)}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => handleLike(story.id, story.likes)}
                        disabled={isLiked(story.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                          isLiked(story.id)
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                        }`}
                        whileHover={!isLiked(story.id) ? { scale: 1.05 } : {}}
                        whileTap={!isLiked(story.id) ? { scale: 0.95 } : {}}
                      >
                        <motion.div
                          animate={isLiked(story.id) ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart 
                            className={`w-5 h-5 ${isLiked(story.id) ? 'fill-current' : ''}`}
                          />
                        </motion.div>
                        <span className="font-semibold">{story.likes}</span>
                      </motion.button>
                    </div>
                    <div className="prose max-w-none dark:prose-invert">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {story.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  )
}
