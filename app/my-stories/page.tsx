'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Navigation from '@/components/Navigation'
import StoryCard from '@/components/StoryCard'
import ReadingSettings from '@/components/ReadingSettings'
import { Story } from '@/types/story'
import { formatDate, isLiked } from '@/lib/utils'
import { getDeviceId } from '@/lib/deviceId'
import { ensureNickname } from '@/lib/nickname'

export default function MyStoriesPage() {
  const [myStories, setMyStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [reGenerating, setReGenerating] = useState<Map<string, boolean>>(new Map())
  const [reGenerateError, setReGenerateError] = useState<Map<string, string>>(new Map())
  const isRegeneratingRef = useRef<Map<string, boolean>>(new Map())

  // Load my stories from localStorage
  useEffect(() => {
    const loadStories = () => {
      try {
        const savedStories = localStorage.getItem('myStories')
        if (savedStories) {
          setMyStories(JSON.parse(savedStories))
        }
      } catch {
        // Invalid JSON
      } finally {
        setLoading(false)
      }
    }
    loadStories()
  }, [])

  const handleImageGenerated = (storyId: string, imageUrl: string) => {
    // Update the story in myStories with the new image URL
    const updatedStories = myStories.map(story => 
      story.id === storyId 
        ? { ...story, image_url: imageUrl }
        : story
    )
    setMyStories(updatedStories)
    localStorage.setItem('myStories', JSON.stringify(updatedStories))
  }

  // 再次创作故事
  const handleRegenerate = async (story: Story) => {
    const storyId = story.id
    const words = story.words
    
    // 使用 ref 确保原子性检查，防止快速连续点击
    if (isRegeneratingRef.current.get(storyId)) {
      setReGenerateError(prev => new Map(prev).set(storyId, '正在再次创作中，请等待上一次完成'))
      return
    }
    
    if (!words || words.trim().length === 0) {
      return
    }

    const trimmedWord = words.trim()

    // 设置生成状态（同时更新 state 和 ref）
    isRegeneratingRef.current.set(storyId, true)
    setReGenerating(prev => new Map(prev).set(storyId, true))
    setReGenerateError(prev => {
      const newMap = new Map(prev)
      newMap.delete(storyId)
      return newMap
    })
    
    try {
      const deviceId = getDeviceId()
      await ensureNickname()

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words: trimmedWord, deviceId }),
        keepalive: true as any,
      })

      const data = await response.json()

      if (response.ok) {
        // 更新本地 myStories，将新故事插入到顶部
        const newStories = [data.story as Story, ...myStories]
        setMyStories(newStories)
        localStorage.setItem('myStories', JSON.stringify(newStories))
      } else {
        setReGenerateError(prev => new Map(prev).set(storyId, data.error || '再次创作失败'))
      }
    } catch (e) {
      console.error('Regenerate story error:', e)
      setReGenerateError(prev => new Map(prev).set(storyId, '网络错误，请稍后重试'))
    } finally {
      isRegeneratingRef.current.set(storyId, false)
      setReGenerating(prev => {
        const newMap = new Map(prev)
        newMap.delete(storyId)
        return newMap
      })
    }
  }

  const handleLike = async (storyId: string, currentLikes: number) => {
    const likedStories = JSON.parse(localStorage.getItem('likedStories') || '[]')
    if (likedStories.includes(storyId)) {
      return
    }

    // Optimistic update
    setMyStories(prev => prev.map(story => 
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

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('likedStories', JSON.stringify([...likedStories, storyId]))
        setMyStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: data.likes }
            : story
        ))
      } else {
        // Revert on error
        setMyStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, likes: currentLikes }
            : story
        ))
      }
    } catch {
      // Revert on error
      setMyStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likes: currentLikes }
          : story
      ))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <TopBar />
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
            <BookOpen className="w-10 h-10 text-purple-500" />
            我的创作
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            
          </p>
          <Navigation />
        </motion.header>

        {/* My Stories List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">加载中...</p>
          </div>
        ) : myStories.length > 0 ? (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              我的创作
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({myStories.length} 个故事)
              </span>
            </h2>
            <AnimatePresence>
              {myStories.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onLike={handleLike}
                  isLiked={isLiked}
                  formatDate={formatDate}
                  index={index}
                  onImageGenerated={handleImageGenerated}
                  onRegenerate={handleRegenerate}
                  isRegenerating={reGenerating.get(story.id) || false}
                  regenerateError={reGenerateError.get(story.id)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              还没有创作故事，快去创作第一个吧！
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

