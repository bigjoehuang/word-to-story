'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Sparkles, 
  Loader2,
  Compass,
  BookOpen
} from 'lucide-react'
import TopBar from '@/components/TopBar'
import Navigation from '@/components/Navigation'
import ReadingSettings from '@/components/ReadingSettings'

interface WordCount {
  word: string
  count: number
}

export default function ExplorePage() {
  const [words, setWords] = useState<WordCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Fetch words with counts
  useEffect(() => {
    const fetchWords = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/words')
        const data = await response.json()
        
        if (response.ok) {
          setWords(data.words || [])
        } else {
          setError(data.error || '获取字列表失败')
        }
      } catch {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }
    fetchWords()
  }, [])

  const handleWordClick = (word: string) => {
    router.push(`/read?word=${encodeURIComponent(word)}`)
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
            <Compass className="w-10 h-10 text-blue-500" />
            探索故事
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            发现其他用户创作的精彩故事
          </p>
          <Navigation />
        </motion.header>

        {/* Words List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-500" />
            按字浏览
            {words.length > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({words.length} 个字)
              </span>
            )}
          </h2>
          
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
          ) : words.length === 0 ? (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {words.map((item, index) => (
                <motion.button
                  key={item.word}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleWordClick(item.word)}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {item.word}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.count} 个故事
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

