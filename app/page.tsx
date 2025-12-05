'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, X } from 'lucide-react'
import TopBar from '@/components/TopBar'
import Navigation from '@/components/Navigation'
import StoryCard from '@/components/StoryCard'
import GenerationProgress from '@/components/GenerationProgress'
import ReadingSettings from '@/components/ReadingSettings'
import Confetti from '@/components/Confetti'
import { Story } from '@/types/story'
import { formatDate, isLiked } from '@/lib/utils'
import { getDeviceId } from '@/lib/deviceId'
import { saveGenerationTime } from '@/lib/generationTime'
import { ensureNickname } from '@/lib/nickname'
import { 
  ALL_CHARACTERS, 
  getCharactersByCategory, 
  getCategories,
  type Character 
} from '@/lib/character-dict'

type StoryStyle = 'default' | 'warm' | 'humor' | 'realistic' | 'fantasy'
type CharacterType = 'none' | 'custom' | 'preset'

const STORY_STYLES: {
  id: StoryStyle
  name: string
  description: string
}[] = [
  {
    id: 'default',
    name: '默认风格',
    description: '整体平衡，有趣又引人思考（当前正在使用的默认写作风格）',
  },
  {
    id: 'warm',
    name: '温暖治愈',
    description: '基调温柔，关注情感与陪伴，在细腻的日常里慢慢给出启发',
  },
  {
    id: 'humor',
    name: '幽默启发',
    description: '语气更轻松有趣，用一点幽默包装背后的道理，但不会变成纯搞笑段子',
  },
  {
    id: 'realistic',
    name: '现实写实',
    description: '更贴近日常生活，用真实细节刻画出普通人身上耐人寻味的哲理',
  },
  {
    id: 'fantasy',
    name: '奇幻寓言',
    description: '适度加入奇幻或象征设定，像寓言一样在故事情节背后藏着思考',
  },
]

export default function Home() {
  const [words, setWords] = useState('')
  const [loading, setLoading] = useState(false)
  const [generationStartTime, setGenerationStartTime] = useState(0)
  const [latestStory, setLatestStory] = useState<Story | null>(null)
  const [error, setError] = useState('')
  const [dailyLimit, setDailyLimit] = useState({ limit: 5, used: 0, remaining: 5 })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [storyStyle, setStoryStyle] = useState<StoryStyle>('default')
  const [characterType, setCharacterType] = useState<CharacterType>('none')
  const [customCharacterName, setCustomCharacterName] = useState('')
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>([])
  const [characterCategory, setCharacterCategory] = useState<'wuxia' | 'modern' | 'history' | 'classic' | 'anime' | 'fairy-tale' | 'world-leaders' | 'unique-personalities' | 'cultural-icons'>('wuxia')
  const isGeneratingRef = useRef(false)

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
    
    // 使用 ref 确保原子性检查，防止快速连续点击
    if (isGeneratingRef.current) {
      setError('正在生成故事，请等待上一次完成')
      return
    }
    
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

    // 设置生成状态（同时更新 state 和 ref）
    isGeneratingRef.current = true
    setLoading(true)
    setError('')
    const startTime = Date.now()
    setGenerationStartTime(startTime)

    try {
      const deviceId = getDeviceId()

      // 确保当前用户已有昵称（会在需要时提示设置一个，提供随机建议）
      await ensureNickname()
      
      // 构建角色信息（支持1-3个角色）
      let characterName: string | undefined
      if (characterType === 'custom' && customCharacterName.trim()) {
        // 自定义角色：按空格分割，验证数量
        const names = customCharacterName.trim().split(/\s+/).filter(n => n.length > 0)
        if (names.length >= 1 && names.length <= 3) {
          // 验证每个角色名长度（1-10个字符）
          const validNames = names.filter(n => n.length >= 1 && n.length <= 10)
          if (validNames.length === names.length) {
            characterName = validNames.join(' ')
          }
        }
      } else if (characterType === 'preset' && selectedCharacterIds.length > 0) {
        // 预设角色：最多3个
        const selectedNames = selectedCharacterIds
          .slice(0, 3)
          .map(id => ALL_CHARACTERS.find(c => c.id === id)?.name)
          .filter((name): name is string => !!name)
        if (selectedNames.length > 0) {
          characterName = selectedNames.join(' ')
        }
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          words: trimmedWords, 
          deviceId, 
          style: storyStyle,
          characterType: characterType === 'none' ? undefined : characterType,
          characterName: characterName || undefined,
        }),
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
        
        // 触发撒花动画
        setShowConfetti(true)
        
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
      isGeneratingRef.current = false
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
      <TopBar />
      <ReadingSettings />
      
      {/* 撒花动画 */}
      <AnimatePresence>
        {showConfetti && (
          <Confetti onComplete={() => setShowConfetti(false)} />
        )}
      </AnimatePresence>
      
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
          className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 border border-gray-200 dark:border-gray-700 transition-opacity ${
            loading ? 'opacity-75' : ''
          }`}
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
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={loading ? {} : { scale: 1.1 }}
                    whileTap={loading ? {} : { scale: 0.9 }}
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

            {/* Advanced settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
              <button
                type="button"
                disabled={loading}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setShowAdvanced((prev) => !prev)}
              >
                高级设置
                <span className="text-xs">
                  {showAdvanced ? '（收起）' : '（选择角色和风格）'}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-4 overflow-hidden"
                  >
                    {/* Character Selection */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        角色（可选，1-3个）
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        可以为故事指定1-3个角色，让AI围绕这些角色展开故事
                      </p>
                      <div className="space-y-2">
                        <label className={`flex items-center gap-2 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            name="character-type"
                            value="none"
                            checked={characterType === 'none'}
                            onChange={() => setCharacterType('none')}
                            disabled={loading}
                            className="accent-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">不指定角色（AI自动生成）</span>
                        </label>
                        <label className={`flex items-center gap-2 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            name="character-type"
                            value="custom"
                            checked={characterType === 'custom'}
                            onChange={() => setCharacterType('custom')}
                            disabled={loading}
                            className="accent-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">自定义名字</span>
                        </label>
                        {characterType === 'custom' && (
                          <div className="ml-6 space-y-2">
                            <input
                              type="text"
                              value={customCharacterName}
                              onChange={(e) => {
                                const value = e.target.value
                                // 允许空格分隔的多个角色名，每个角色名1-10个字符
                                // 使用正则验证：允许中文、英文、数字和空格，但空格不能连续
                                const parts = value.split(/\s+/).filter(p => p.length > 0)
                                const isValid = parts.every(part => 
                                  part.length <= 10 && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(part)
                                ) && parts.length <= 3
                                
                                if (isValid || value === '') {
                                  setCustomCharacterName(value)
                                }
                              }}
                              placeholder="输入角色名字，用空格分开（1-3个角色，每个1-10个字符）"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              disabled={loading}
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(() => {
                                const parts = customCharacterName.trim().split(/\s+/).filter(p => p.length > 0)
                                const count = parts.length
                                return count > 0 
                                  ? `已输入 ${count} 个角色${count > 3 ? '（最多3个）' : ''}`
                                  : '例如：小明 小红 小刚'
                              })()}
                            </p>
                          </div>
                        )}
                        <label className={`flex items-center gap-2 ${loading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                          <input
                            type="radio"
                            name="character-type"
                            value="preset"
                            checked={characterType === 'preset'}
                            onChange={() => setCharacterType('preset')}
                            disabled={loading}
                            className="accent-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">选择系统角色</span>
                        </label>
                        {characterType === 'preset' && (
                          <div className="ml-6 space-y-2">
                            {/* Category Selection */}
                            <div className="flex gap-2 flex-wrap">
                              {getCategories().map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  disabled={loading}
                                  onClick={() => {
                                    setCharacterCategory(cat.id)
                                    // 切换分类时不清除已选角色，允许跨分类选择
                                  }}
                                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                                    characterCategory === cat.id
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  {cat.name}
                                </button>
                              ))}
                            </div>
                            {/* Character Selection - Multi-select with checkboxes */}
                            <div className="space-y-2">
                              {/* 显示已选择的角色（所有分类） */}
                              {selectedCharacterIds.length > 0 && (
                                <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                                    已选择 {selectedCharacterIds.length} / 3 个角色：
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {selectedCharacterIds.map((id) => {
                                      const char = ALL_CHARACTERS.find(c => c.id === id)
                                      if (!char) return null
                                      return (
                                        <span
                                          key={id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                                        >
                                          {char.name}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedCharacterIds(selectedCharacterIds.filter(i => i !== id))
                                            }}
                                            className="hover:text-blue-900 dark:hover:text-blue-100"
                                            disabled={loading}
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        </span>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              {/* 当前分类的角色列表 */}
                              <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700">
                                {getCharactersByCategory(characterCategory).map((char) => {
                                  const isSelected = selectedCharacterIds.includes(char.id)
                                  return (
                                    <label
                                      key={char.id}
                                      className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors ${
                                        loading || (!isSelected && selectedCharacterIds.length >= 3)
                                          ? 'cursor-not-allowed opacity-50'
                                          : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600'
                                      } ${
                                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            // 最多选择3个
                                            if (selectedCharacterIds.length < 3) {
                                              setSelectedCharacterIds([...selectedCharacterIds, char.id])
                                            }
                                          } else {
                                            setSelectedCharacterIds(selectedCharacterIds.filter(id => id !== char.id))
                                          }
                                        }}
                                        disabled={loading || (!isSelected && selectedCharacterIds.length >= 3)}
                                        className="accent-blue-500"
                                      />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {char.name}
                                        {char.description && (
                                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                            - {char.description}
                                          </span>
                                        )}
                                      </span>
                                    </label>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Story Style Selection */}
                    <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        故事风格
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        不同风格只是在语言氛围上略有侧重，都会保持「有趣又引人思考」的整体基调。
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {STORY_STYLES.map((style) => (
                          <label
                            key={style.id}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                              loading
                                ? 'cursor-not-allowed opacity-50'
                                : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-400'
                            } ${
                              storyStyle === style.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="story-style"
                              value={style.id}
                              checked={storyStyle === style.id}
                              onChange={() => setStoryStyle(style.id)}
                              disabled={loading}
                              className="mt-1 accent-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-100">
                                {style.name}
                                {style.id === 'default' && (
                                  <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                    （默认）
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {style.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
