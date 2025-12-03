'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import InfiniteScroll from 'react-infinite-scroll-component'
import { 
  Sparkles, 
  Loader2,
  Compass
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Navigation from '@/components/Navigation'
import StorySkeleton from '@/components/StorySkeleton'
import StoryCard from '@/components/StoryCard'
import { Story, Pagination } from '@/types/story'
import { formatDate, isLiked } from '@/lib/utils'

export default function ExplorePage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [pagination, setPagination] = useState<Pagination | null>(null)

  // Fetch stories with pagination
  const fetchStories = useCallback(async (reset = false) => {
    try {
      const currentPage = reset ? 1 : page
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: 'created_at'
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
    } catch {
      setError('网络错误')
    } finally {
      setLoadingStories(false)
    }
  }, [page])

  // Fetch stories on mount
  useEffect(() => {
    setLoadingStories(true)
    setPage(1)
    fetchStories(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    } catch {
      // Revert on error
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likes: currentLikes }
          : story
      ))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.header 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Compass className="w-10 h-10 text-blue-500" />
            探索故事
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            发现其他用户创作的精彩故事
          </p>
          <Navigation />
        </motion.header>

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
                还没有故事，快去创作第一个吧！
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
                  <StoryCard
                    key={story.id}
                    story={story}
                    onLike={handleLike}
                    isLiked={isLiked}
                    formatDate={formatDate}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  )
}

