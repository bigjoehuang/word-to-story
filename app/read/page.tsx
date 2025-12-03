'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  Heart,
  Sparkles
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import ReadingSettings from '@/components/ReadingSettings'
import HighlightableText from '@/components/HighlightableText'
import { Story } from '@/types/story'
import { useReadingSettings, fontFamilyMap, fontSizeMap } from '@/lib/readingSettings'
import { isLiked, isRead, markRead } from '@/lib/utils'
import { getDeviceId } from '@/lib/deviceId'
import { ensureNickname } from '@/lib/nickname'

function ReadPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const word = searchParams.get('word')
  const storyIdFromQuery = searchParams.get('storyId')
  
  const [stories, setStories] = useState<Story[]>([])
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(-1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // 记录当前会话中浏览过的故事索引（仅用于高亮/导航），真实"已读"数量使用 isRead 计算
  const [viewedIndices, setViewedIndices] = useState<Set<number>>(new Set())
  const [canMarkRead, setCanMarkRead] = useState(false)
  const [reGenerating, setReGenerating] = useState(false)
  const [reGenerateError, setReGenerateError] = useState('')
  const isRegeneratingRef = useRef(false)
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
          const storiesList: Story[] = data.stories || []
          setStories(storiesList)
          
          if (storiesList.length > 0) {
            // 如果 URL 中带有 storyId，优先展示对应故事
            if (storyIdFromQuery) {
              const targetIndex = storiesList.findIndex((s) => s.id === storyIdFromQuery)
              if (targetIndex >= 0) {
                setCurrentStoryIndex(targetIndex)
                setViewedIndices(new Set([targetIndex]))
                return
              }
            }

            // 否则默认展示最新的第 1 个故事（index 0）
            setCurrentStoryIndex(0)
            setViewedIndices(new Set([0]))
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
  }, [word, storyIdFromQuery])

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
      const deviceId = getDeviceId()
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storyId, deviceId }),
      })

      const data: any = await response.json()

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

  // 至少阅读 20 秒后才允许点击“读完”
  useEffect(() => {
    setCanMarkRead(false)
    if (!currentStory) return
    const timer = setTimeout(() => {
      setCanMarkRead(true)
    }, 20000)
    return () => clearTimeout(timer)
  }, [currentStory?.id])

  // 再次创作当前字的故事（不会跳转页面）
  const handleRegenerate = async () => {
    // 使用 ref 确保原子性检查，防止快速连续点击
    if (isRegeneratingRef.current) {
      setReGenerateError('正在再次创作中，请等待上一次完成')
      return
    }
    
    if (!word) return
    const trimmedWord = String(word).trim()
    if (!trimmedWord) return

    // 设置生成状态（同时更新 state 和 ref）
    isRegeneratingRef.current = true
    setReGenerating(true)
    setReGenerateError('')
    
    try {
      const deviceId = getDeviceId()
      await ensureNickname()

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: trimmedWord, deviceId }),
        // 保证即使用户离开当前页，请求也尽量继续进行
        keepalive: true as any,
      })

      const data = await response.json()

      if (response.ok) {
        // 更新本地 myStories（我的创作页使用）
        try {
          const savedStories = JSON.parse(localStorage.getItem('myStories') || '[]')
          const newStories = [data.story, ...savedStories]
          localStorage.setItem('myStories', JSON.stringify(newStories))
        } catch {
          // ignore localStorage errors
        }

        // 如果还在当前阅读页，更新当前字的故事列表，把新故事插到最前面
        setStories((prev) => [data.story as Story, ...prev])
        setCurrentStoryIndex(0)
        setViewedIndices(new Set([0]))
      } else {
        setReGenerateError(data.error || '再次创作失败')
      }
    } catch (e) {
      console.error('Regenerate story error:', e)
      setReGenerateError('网络错误，请稍后重试')
    } finally {
      isRegeneratingRef.current = false
      setReGenerating(false)
    }
  }

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
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2 flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              {word}
            </h1>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {stories.length > 0 && (
                  <>
                    共 {stories.length} 个故事 · 已读{' '}
                    {stories.filter((story) => isRead(story.id)).length} 个
                  </>
                )}
              </p>
              {stories.length > 0 && (
                <motion.button
                  onClick={handleRegenerate}
                  disabled={reGenerating}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={!reGenerating ? { scale: 1.05 } : {}}
                  whileTap={!reGenerating ? { scale: 0.95 } : {}}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{reGenerating ? '再次创作中...' : '再次创作'}</span>
                </motion.button>
              )}
            </div>

            {/* 故事序号圆点，从新到旧 */}
            {stories.length > 1 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                {stories.map((_, index) => {
                  const displayIndex = index + 1 // 1 开始
                  const isActive = index === currentStoryIndex
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentStoryIndex(index)
                        setViewedIndices(prev => new Set([...prev, index]))
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-400'
                      }`}
                    >
                      {displayIndex}
                    </button>
                  )
                })}
              </div>
            )}

            {reGenerateError && (
              <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                {reGenerateError}
              </p>
            )}
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
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-4">
                {/* 点赞 + 信息行 */}
                <div className="flex items-center justify-between">
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

                {/* 底部居中的“读完”圆形按钮（放大一倍） */}
                <div className="flex justify-center">
                  <motion.button
                    onClick={() => {
                      if (isRead(currentStory.id)) return
                      markRead(currentStory.id)
                      // 触发一次重渲染，让按钮立即点亮
                      setStories((prev) => [...prev])
                    }}
                    disabled={isRead(currentStory.id) || !canMarkRead}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-all duration-200 ${
                      isRead(currentStory.id)
                        ? 'bg-emerald-500 text-white cursor-default shadow-lg shadow-emerald-300/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    }`}
                    whileHover={!isRead(currentStory.id) ? { scale: 1.05 } : {}}
                    whileTap={!isRead(currentStory.id) ? { scale: 0.95 } : {}}
                    animate={
                      isRead(currentStory.id)
                        ? {
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              '0 0 0px rgba(16,185,129,0.0)',
                              '0 0 22px rgba(16,185,129,0.75)',
                              '0 0 0px rgba(16,185,129,0.0)',
                            ],
                          }
                        : {}
                    }
                    transition={{ duration: 0.45 }}
                  >
                    {isRead(currentStory.id) ? '已读完' : '读完'}
                  </motion.button>
                </div>
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

