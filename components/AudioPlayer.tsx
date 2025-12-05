'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Loader2, Volume2, VolumeX } from 'lucide-react'
import { getDeviceId } from '@/lib/deviceId'

interface AudioPlayerProps {
  storyId: string
  content: string
  audioUrl?: string | null
}

export default function AudioPlayer({ storyId, content, audioUrl: initialAudioUrl }: AudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 初始化音频元素
  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      setError('音频播放失败')
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl])

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // 生成音频
  const generateAudio = async () => {
    if (isLoading) return

    setIsLoading(true)
    setError('')

    try {
      const deviceId = getDeviceId()
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          content,
          deviceId,
        }),
      })

      const data = await response.json()

      if (response.ok && data.audio_url) {
        setAudioUrl(data.audio_url)
      } else {
        // 如果是503错误，说明API未配置
        if (response.status === 503) {
          setError('音频功能暂未开通，请联系管理员配置')
        } else {
          setError(data.error || '生成音频失败')
        }
      }
    } catch (e) {
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 播放/暂停
  const togglePlay = async () => {
    if (!audioUrl) {
      await generateAudio()
      return
    }

    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
        setError('')
      } catch (e) {
        setError('播放失败，请重试')
        setIsPlaying(false)
      }
    }
  }

  // 静音/取消静音
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 进度条点击
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        {/* 播放按钮 */}
        <motion.button
          onClick={togglePlay}
          disabled={isLoading}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </motion.button>

        {/* 进度条和时间 */}
        <div className="flex-1 min-w-0">
          <div
            className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer mb-1"
            onClick={handleProgressClick}
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: duration ? `${(currentTime / duration) * 100}%` : 0 }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 静音按钮 */}
        {audioUrl && (
          <motion.button
            onClick={toggleMute}
            className="flex-shrink-0 w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </motion.button>
        )}
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 text-sm text-red-500 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* 提示信息 */}
      {!audioUrl && !isLoading && !error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          点击播放按钮生成并播放音频
        </p>
      )}
    </div>
  )
}

