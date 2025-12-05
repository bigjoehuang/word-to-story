'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Clock, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react'
import { Story } from '@/types/story'
import HighlightableText from './HighlightableText'
import { useReadingSettings, fontFamilyMap, fontSizeMap } from '@/lib/readingSettings'

interface StoryCardProps {
  story: Story
  onLike: (storyId: string, currentLikes: number) => void
  isLiked: (storyId: string) => boolean
  formatDate: (dateString: string) => string
  index?: number
  onImageGenerated?: (storyId: string, imageUrl: string) => void
  onRegenerate?: (story: Story) => void
  isRegenerating?: boolean
  regenerateError?: string
}

export default function StoryCard({ 
  story, 
  onLike, 
  isLiked, 
  formatDate,
  index = 0,
  onImageGenerated,
  onRegenerate,
  isRegenerating = false,
  regenerateError
}: StoryCardProps) {
  const liked = isLiked(story.id)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(story.image_url || null)
  const { fontFamily, fontSize } = useReadingSettings()

  // 同步 story.image_url 的变化（当从API获取新数据时）
  useEffect(() => {
    if (story.image_url) {
      setImageUrl(story.image_url)
    }
  }, [story.image_url])

  const handleGenerateImage = async () => {
    if (generatingImage) return
    
    setGeneratingImage(true)
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId: story.id,
          words: story.words,
          content: story.content
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '生成图片失败')
      }

      if (data.imageUrl) {
        setImageUrl(data.imageUrl)
        if (onImageGenerated) {
          onImageGenerated(story.id, data.imageUrl)
        }
      }
    } catch (error) {
      console.error('生成图片错误:', error)
      alert(error instanceof Error ? error.message : '生成图片失败，请稍后重试')
    } finally {
      setGeneratingImage(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
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
          {story.author_nickname && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              创作人：{story.author_nickname}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <motion.button
              onClick={() => onRegenerate(story)}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              whileHover={!isRegenerating ? { scale: 1.05 } : {}}
              whileTap={!isRegenerating ? { scale: 0.95 } : {}}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>创作中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>再次创作</span>
                </>
              )}
            </motion.button>
          )}
          {!imageUrl && (
            <motion.button
              onClick={handleGenerateImage}
              disabled={generatingImage}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 hover:from-green-200 hover:to-emerald-200 dark:hover:from-green-800/40 dark:hover:to-emerald-800/40 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={!generatingImage ? { scale: 1.05 } : {}}
              whileTap={!generatingImage ? { scale: 0.95 } : {}}
            >
              {generatingImage ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">生成中...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-xs">生成配图</span>
                </>
              )}
            </motion.button>
          )}
          <motion.button
            onClick={() => onLike(story.id, story.likes)}
            disabled={liked}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              liked
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
            }`}
            whileHover={!liked ? { scale: 1.05 } : {}}
            whileTap={!liked ? { scale: 0.95 } : {}}
          >
            <motion.div
              animate={liked ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart 
                className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
              />
            </motion.div>
            <span className="font-semibold">{story.likes}</span>
          </motion.button>
        </div>
      </div>
      
      {/* Regenerate Error */}
      {regenerateError && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">{regenerateError}</p>
        </div>
      )}
      
      {/* Story Image */}
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg overflow-hidden shadow-md"
        >
          <img
            src={imageUrl}
            alt={`${story.words} 配图`}
            className="w-full h-auto object-cover"
            onError={(e) => {
              console.error('图片加载失败:', imageUrl)
              e.currentTarget.style.display = 'none'
            }}
          />
        </motion.div>
      )}
      <div className="prose max-w-none dark:prose-invert">
        <div 
          className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: fontFamilyMap[fontFamily],
            fontSize: fontSizeMap[fontSize],
          }}
        >
          <HighlightableText 
            text={story.content}
            storyId={story.id}
          />
        </div>
      </div>
    </motion.div>
  )
}

