'use client'

import { motion } from 'framer-motion'
import { Heart, Clock } from 'lucide-react'
import { Story } from '@/types/story'

interface StoryCardProps {
  story: Story
  onLike: (storyId: string, currentLikes: number) => void
  isLiked: (storyId: string) => boolean
  formatDate: (dateString: string) => string
  index?: number
}

export default function StoryCard({ 
  story, 
  onLike, 
  isLiked, 
  formatDate,
  index = 0 
}: StoryCardProps) {
  const liked = isLiked(story.id)

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
        </div>
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
      <div className="prose max-w-none dark:prose-invert">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {story.content}
        </p>
      </div>
    </motion.div>
  )
}

