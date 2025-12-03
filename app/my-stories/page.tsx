'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import Navigation from '@/components/Navigation'
import StoryCard from '@/components/StoryCard'
import ReadingSettings from '@/components/ReadingSettings'
import { Story } from '@/types/story'
import { formatDate, isLiked } from '@/lib/utils'

export default function MyStoriesPage() {
  const [myStories, setMyStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

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
            <BookOpen className="w-10 h-10 text-purple-500" />
            我的创作
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            查看你创作的所有故事
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

