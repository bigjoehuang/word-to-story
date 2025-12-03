'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { getEstimatedGenerationTime, getMaxGenerationTime } from '@/lib/generationTime'

interface GenerationProgressProps {
  startTime: number
  isGenerating: boolean
}

export default function GenerationProgress({ startTime, isGenerating }: GenerationProgressProps) {
  const [progress, setProgress] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(30000) // 默认30秒
  const [maxTime, setMaxTime] = useState(60000) // 默认60秒

  // Load estimated time from database when component mounts or when generation starts
  useEffect(() => {
    if (isGenerating) {
      const loadTimes = async () => {
        const [estimated, max] = await Promise.all([
          getEstimatedGenerationTime(),
          getMaxGenerationTime()
        ])
        setEstimatedTime(estimated)
        setMaxTime(max)
      }
      loadTimes()
    }
  }, [isGenerating])

  useEffect(() => {
    if (!isGenerating) {
      setProgress(0)
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setElapsedTime(elapsed)

      // 计算进度：使用预估时间，但不超过最大时间
      // 使用平滑的进度计算，增加10%缓冲时间
      const targetTime = Math.min(estimatedTime * 1.1, maxTime)
      let calculatedProgress = (elapsed / targetTime) * 100
      
      // 确保进度不会超过95%，等待实际完成
      calculatedProgress = Math.min(calculatedProgress, 95)
      setProgress(calculatedProgress)
    }, 100) // 每100ms更新一次

    return () => clearInterval(interval)
  }, [startTime, isGenerating, estimatedTime, maxTime])

  if (!isGenerating) return null

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) {
      return `${seconds}秒`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}分${remainingSeconds}秒`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          AI正在创作中...
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>

      {/* Time Info */}
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span>已用时: {formatTime(elapsedTime)}</span>
        <span>预估: {formatTime(estimatedTime)}</span>
      </div>
    </motion.div>
  )
}

