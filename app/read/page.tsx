'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  RefreshCw,
  Loader2,
  BookOpen,
  Heart
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import ReadingSettings from '@/components/ReadingSettings'
import HighlightableText from '@/components/HighlightableText'
import { Story } from '@/types/story'
import { useReadingSettings, fontFamilyMap, fontSizeMap } from '@/lib/readingSettings'
import { isLiked } from '@/lib/utils'

function ReadPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const word = searchParams.get('word')
  
  const [stories, setStories] = useState<Story[]>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(-1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewedIndices, setViewedIndices] = useState<Set<number>>(new Set())
  const { fontFamily, fontSize } = useReadingSettings()

  // Fetch stories for the word
  useEffect(() => {
    if (!word) {
      setError('请提供字参数')
      setLoading(false)
      return
    }

    const fetchStories = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/stories-by-word?word=${encodeURIComponent(word)}`)
        const data = await response.json()
        
        if (response.ok) {
          const storiesList = data.stories || []
          setStories(storiesList)
          
          // 随机选择一个故事
          if (storiesList.length > 0) {
            const randomIndex = Math.floor(Math.random() * storiesList.length)
            setCurrentStoryIndex(randomIndex)
            setViewedIndices(new Set([randomIndex]))
          } else {
            setError('该字还没有故事')
          }
        } else {
          setError(data.error || '获取故事失败')
        }
      } catch {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [word])

  // 切换到下一个未读过的故事
  const handleNextStory = () => {
    if (stories.length === 0) return

    // 获取未看过的故事索引
    const unviewedIndices = stories
      .map((_, index) => index)
      .filter(index => !viewedIndices.has(index))

    if (unviewedIndices.length === 0) {
      // 如果所有故事都看过了，重置并随机选择一个
      const randomIndex = Math.floor(Math.random() * stories.length)
      setCurrentStoryIndex(randomIndex)
      setViewedIndices(new Set([randomIndex]))
    } else {
      // 从未看过的故事中随机选择一个
      const randomIndex = unviewedIndices[Math.floor(Math.random() * unviewedIndices.length)]
      setCurrentStoryIndex(randomIndex)
      setViewedIndices(prev => new Set([...prev, randomIndex]))
    }
  }

  // 处理点赞
  const handleLike = async (storyId: string, currentLikes: number) => {
    const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
    if (likedStories.includes(storyId)) {
      return
    }

    // 乐观更新
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
        // 失败时回滚
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: currentLikes }
            : story
        ))
      }
    } catch {
      // 失败时回滚
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likes: currentLikes }
          : story
      ))
    }
  }

  const currentStory = currentStoryIndex >= 0 ? stories[currentStoryIndex] : null
  const hasMoreStories = stories.length > 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <TopBar />
      <ReadingSettings />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/explore')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              返回探索
            </button>
            
            {hasMoreStories && (
              <button
                onClick={handleNextStory}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-4 h-4" />
                不喜欢，换一个
              </button>
            )}
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              {word}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {stories.length > 0 && (
                <>共 {stories.length} 个故事 · 已看 {viewedIndices.size} 个</>
              )}
            </p>
          </div>
        </motion.header>

        {/* Story Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <p className="text-red-500 dark:text-red-400 text-lg">{error}</p>
          </motion.div>
        ) : currentStory ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
            >
              {/* Story Image */}
              {currentStory.image_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 rounded-lg overflow-hidden shadow-md"
                >
                  <img
                    src={currentStory.image_url}
                    alt={`${currentStory.words} 配图`}
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </motion.div>
              )}

              {/* Story Content */}
              <div className="prose max-w-none dark:prose-invert">
                <div 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                  style={{
                    fontFamily: fontFamilyMap[fontFamily],
                    fontSize: fontSizeMap[fontSize],
                  }}
                >
                  <HighlightableText 
                    text={currentStory.content}
                    storyId={currentStory.id}
                  />
                </div>
              </div>

              {/* Story Meta */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <motion.button
                  onClick={() => handleLike(currentStory.id, currentStory.likes)}
                  disabled={isLiked(currentStory.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isLiked(currentStory.id)
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                  whileHover={!isLiked(currentStory.id) ? { scale: 1.05 } : {}}
                  whileTap={!isLiked(currentStory.id) ? { scale: 0.95 } : {}}
                >
                  <motion.div
                    animate={isLiked(currentStory.id) ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Heart 
                      className={`w-5 h-5 ${isLiked(currentStory.id) ? 'fill-current' : ''}`}
                    />
                  </motion.div>
                  <span className="font-semibold">{currentStory.likes}</span>
                </motion.button>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex flex-col items-end text-right">
                  {currentStory.author_nickname && (
                    <span className="mb-1">创作人：{currentStory.author_nickname}</span>
                  )}
                  <span>{new Date(currentStory.created_at).toLocaleDateString('zh-CN')}</span>
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}
      </div>
    </div>
  )
}

export default function ReadPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <TopBar />
        <ReadingSettings />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    }>
      <ReadPageContent />
    </Suspense>
  )
}

