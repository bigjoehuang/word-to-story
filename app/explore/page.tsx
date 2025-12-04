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

const WORDS_CACHE_KEY = 'explore_words_cache_1'
const PAGE_SIZE = 20

export default function ExplorePage() {
  const [words, setWords] = useState<WordCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const fetchWords = async (pageToLoad: number, showSkeleton: boolean) => {
      try {
        if (showSkeleton) {
          setLoading(true)
        }
        const response = await fetch(`/api/words?page=${pageToLoad}&limit=${PAGE_SIZE}`)
        const data = await response.json()
        
        if (response.ok) {
          const list = data.words || []
          setWords(list)
          setPage(data.page || pageToLoad)
          setTotal(data.total || list.length || 0)
          setTotalPages(data.totalPages || 1)
          if (typeof window !== 'undefined') {
              // 只缓存第一页，避免缓存过多数据
            if (pageToLoad === 1) {
              window.sessionStorage.setItem(
                WORDS_CACHE_KEY,
                JSON.stringify({
                  words: list,
                  total: data.total || list.length || 0,
                  totalPages: data.totalPages || 1,
                })
              )
            }
          }
        } else {
          setError(data.error || '获取字列表失败')
        }
      } catch {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }

    // 如果有缓存（例如通过浏览器返回到本页），优先使用缓存快速展示，
    // 但仍然在后台再拉一次最新数据，以便有新增时自动刷新缓存
    let hasCached = false
    if (typeof window !== 'undefined') {
      const cached = window.sessionStorage.getItem(WORDS_CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            words: WordCount[]
            total?: number
            totalPages?: number
          }
          if (Array.isArray(parsed.words) && parsed.words.length > 0) {
            setWords(parsed.words)
            setTotal(parsed.total || parsed.words.length)
            setTotalPages(parsed.totalPages || 1)
            setPage(1)
            setLoading(false)
            hasCached = true
          }
        } catch {
          // ignore parse error and fall back to fetch
        }
      }
    }

    // 如果没有缓存，展示骨架屏；如果已有缓存，仅在后台静默刷新
    fetchWords(1, !hasCached)
  }, [])

  const handleWordClick = (word: string) => {
    router.push(`/read?word=${encodeURIComponent(word)}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage === page || newPage < 1 || newPage > totalPages) return
    // 切换页时展示骨架屏，提升感知
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const response = await fetch(`/api/words?page=${newPage}&limit=${PAGE_SIZE}`)
        const data = await response.json()
        if (response.ok) {
          const list = data.words || []
          setWords(list)
          setPage(data.page || newPage)
          setTotal(data.total || list.length || 0)
          setTotalPages(data.totalPages || 1)
        } else {
          setError(data.error || '获取字列表失败')
        }
      } catch {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    })()
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
            {total > 0 && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({total} 个字)
              </span>
            )}
          </h2>
          
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
                >
                  <div className="h-8 w-8 mx-auto mb-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-16 mx-auto rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              ))}
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
            <>
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

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                  >
                    上一页
                  </button>
                  <span>
                    第 <span className="font-semibold">{page}</span> / {totalPages} 页
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

