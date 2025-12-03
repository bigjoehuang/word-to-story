'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Navigation from '@/components/Navigation'
import StoryCard from '@/components/StoryCard'
import GenerationProgress from '@/components/GenerationProgress'
import ReadingSettings from '@/components/ReadingSettings'
import { Story } from '@/types/story'
import { formatDate, isLiked } from '@/lib/utils'
import { saveGenerationTime } from '@/lib/generationTime'
import { getDeviceId } from '@/lib/deviceId'
import { ensureNickname } from '@/lib/nickname'

export default function Home() {
  const [words, setWords] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationStartTime, setGenerationStartTime] = useState(0)
  const [latestStory, setLatestStory] = useState<Story | null>(null)
  const [error, setError] = useState('')
  const [dailyLimit, setDailyLimit] = useState({ limit: 5, used: 0, remaining: 5 })

  // Fetch daily limit
  useEffect(() => {
    const fetchDailyLimit = async () => {
      try {
        const deviceId = getDeviceId()
        const response = await fetch(`/api/limit?deviceId=${encodeURIComponent(deviceId)}`)
        const data = await response.json()
        if (response.ok) {
          setDailyLimit(data)
        }
      } catch {
        // Silently fail
      }
    }
    fetchDailyLimit()
  }, [])

  const handleImageGenerated = (storyId: string, imageUrl: string) => {
    // Update the latest story with the new image URL
    if (latestStory && latestStory.id === storyId) {
      setLatestStory({ ...latestStory, image_url: imageUrl })
    }
    // Also update in localStorage
    const savedStories = JSON.parse(localStorage.getItem('myStories') || '[]')
    const updatedStories = savedStories.map((story: Story) => 
      story.id === storyId 
        ? { ...story, image_url: imageUrl }
        : story
    )
    localStorage.setItem('myStories', JSON.stringify(updatedStories))
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedWords = words.trim()
    if (trimmedWords.length === 0 || trimmedWords.length > 3) {
      setError('请输入1-3个字')
      return
    }

    // 前端也检查一次，提供更好的用户体验
    if (dailyLimit.remaining === 0) {
      setError('今日创作次数已用完，请明天再试')
      return
    }

    setLoading(true)
    setError('')
    const startTime = Date.now()
    setGenerationStartTime(startTime)

    try {
      const deviceId = getDeviceId()

      // 确保当前用户已有昵称（会在需要时提示设置一个，提供随机建议）
      await ensureNickname()
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: trimmedWords, deviceId }),
      })

      const data = await response.json()
      const endTime = Date.now()
      const duration = endTime - startTime

      if (response.ok) {
        // Save generation time to database
        await saveGenerationTime(duration)
        
        // Save to localStorage (for my-stories page)
        const savedStories = JSON.parse(localStorage.getItem('myStories') || '[]')
        const newStories = [data.story, ...savedStories]
        localStorage.setItem('myStories', JSON.stringify(newStories))
        
        // Set as latest story (only show this one on home page)
        setLatestStory(data.story)
        setWords('')
        
        // Refresh daily limit
        const deviceId = getDeviceId()
        const limitResponse = await fetch(`/api/limit?deviceId=${encodeURIComponent(deviceId)}`)
        const limitData = await limitResponse.json()
        if (limitResponse.ok) {
          setDailyLimit(limitData)
        }
      } else {
        // API 拦截：处理 429 状态码（达到限制）
        if (response.status === 429) {
          const errorMessage = data.error || '今日创作次数已达上限，请明天再试'
          setError(errorMessage)
          // 立即刷新限制信息
          const deviceId = getDeviceId()
          const limitResponse = await fetch(`/api/limit?deviceId=${encodeURIComponent(deviceId)}`)
          const limitData = await limitResponse.json()
          if (limitResponse.ok) {
            setDailyLimit(limitData)
          }
        } else {
          setError(data.error || '生成故事失败')
        }
      }
    } catch (error) {
      console.error('Generate story error:', error)
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
      setGenerationStartTime(0)
    }
  }

  const handleLike = async (storyId: string, currentLikes: number) => {
    const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
    if (likedStories.includes(storyId)) {
      return
    }

    // Optimistic update
    if (latestStory && latestStory.id === storyId) {
      setLatestStory({ ...latestStory, likes: currentLikes + 1 })
    }

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
        if (latestStory && latestStory.id === storyId) {
          setLatestStory({ ...latestStory, likes: data.likes })
        }
      } else {
        // Revert on error
        if (latestStory && latestStory.id === storyId) {
          setLatestStory({ ...latestStory, likes: currentLikes })
        }
      }
    } catch {
      // Revert on error
      if (latestStory && latestStory.id === storyId) {
        setLatestStory({ ...latestStory, likes: currentLikes })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <ThemeToggle />
      <ReadingSettings />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.header 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-500" />
            字成故事
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            输入1-3个字，AI为你创作一个有趣又引人思考的故事
          </p>
          <Navigation />
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
                  {dailyLimit.remaining} 
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

            {/* Generation Progress */}
            <GenerationProgress 
              startTime={generationStartTime}
              isGenerating={loading}
            />

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

        {/* Latest Story */}
        {latestStory && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              最新创作
            </h2>
            <AnimatePresence>
              <StoryCard
                key={latestStory.id}
                story={latestStory}
                onLike={handleLike}
                isLiked={isLiked}
                formatDate={formatDate}
                index={0}
                onImageGenerated={handleImageGenerated}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
