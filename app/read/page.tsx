'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Loader2,
  BookOpen,
  Heart,
  ArrowUpDown
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import ReadingSettings from '@/components/ReadingSettings'
import HighlightableText from '@/components/HighlightableText'
import AudioPlayer from '@/components/AudioPlayer'
import { Story } from '@/types/story'
import { 
  useReadingSettings, 
  fontFamilyMap, 
  fontSizeMap,
  themeMap,
  lineSpacingMap,
  letterSpacingMap
} from '@/lib/readingSettings'
import { isLiked, isRead, markRead } from '@/lib/utils'
import { getDeviceId } from '@/lib/deviceId'

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
  const [sortBy, setSortBy] = useState<'created_at' | 'likes'>('created_at')
  const { fontFamily, fontSize, theme, lineSpacing, letterSpacing } = useReadingSettings()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [audioApiAvailable, setAudioApiAvailable] = useState<boolean | null>(null)

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        window.matchMedia('(prefers-color-scheme: dark)').matches ||
        document.documentElement.classList.contains('dark')
      )
    }
    checkDarkMode()
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkDarkMode)
    // Also listen for class changes on html element
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode)
      observer.disconnect()
    }
  }, [])

  // 检查音频API是否可用
  useEffect(() => {
    const checkAudioApi = async () => {
      try {
        const response = await fetch('/api/check-audio-api')
        const data = await response.json()
        // 确保正确处理响应数据，只有明确为true时才显示
        const isAvailable = data.success === true && data.available === true
        setAudioApiAvailable(isAvailable)
      } catch (error) {
        // 任何错误都认为API不可用
        setAudioApiAvailable(false)
      }
    }
    checkAudioApi()
  }, [])

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
        const response = await fetch(`/api/stories-by-word?word=${encodeURIComponent(word)}&sortBy=${sortBy}`)
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
  }, [word, storyIdFromQuery, sortBy])

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
              <div className="flex items-center gap-3">
                {stories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'created_at' | 'likes')}
                      className="px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                    >
                      <option value="created_at">按最近的创作时间</option>
                      <option value="likes">按点赞数</option>
                    </select>
                  </div>
                )}
              </div>
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
              className="rounded-2xl shadow-lg p-8 border border-gray-200 dark:border-gray-700"
              style={{
                background: `linear-gradient(to bottom right, ${
                  isDarkMode ? themeMap[theme].dark.from : themeMap[theme].light.from
                }, ${
                  isDarkMode ? themeMap[theme].dark.to : themeMap[theme].light.to
                })`,
              }}
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
                  className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap"
                  style={{
                    fontFamily: fontFamilyMap[fontFamily],
                    fontSize: fontSizeMap[fontSize],
                    lineHeight: lineSpacingMap[lineSpacing],
                    letterSpacing: letterSpacingMap[letterSpacing],
                  }}
                >
                  <HighlightableText 
                    text={currentStory.content}
                    storyId={currentStory.id}
                  />
                </div>
              </div>

              {/* Audio Player - 仅在API配置时显示 */}
              {/* 只有当 audioApiAvailable 明确为 true 时才显示，null 或 false 都不显示 */}
              {audioApiAvailable === true && (
                <div className="mt-6">
                  <AudioPlayer
                    storyId={currentStory.id}
                    content={currentStory.content}
                    audioUrl={currentStory.audio_url}
                  />
                </div>
              )}

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

