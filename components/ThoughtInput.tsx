'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, X, Edit2, Trash2 } from 'lucide-react'
import { getDeviceId } from '@/lib/deviceId'
import { ensureNickname, fetchNicknameForDevice } from '@/lib/nickname'

// 简单的内存缓存：按 highlightId 缓存想法列表
// 刷新页面后会丢失，但可以显著减少同一会话内的重复请求卡顿
const thoughtCache = new Map<string, Thought[]>()

interface Thought {
  id: string
  highlight_id: string
  content: string
  created_at: string
  user_id?: string
}

interface ThoughtInputProps {
  highlightId: string
  storyId: string
  position: { x: number; y: number }
  onClose: () => void
  onThoughtSaved: () => void
}

export default function ThoughtInput({ 
  highlightId, 
  storyId, 
  position, 
  onClose,
  onThoughtSaved 
}: ThoughtInputProps) {
  const [thought, setThought] = useState('')
  const [existingThoughts, setExistingThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const currentDeviceId = getDeviceId() // 缓存设备ID，避免重复调用
  const [nicknameMap, setNicknameMap] = useState<Record<string, string>>({})

  // Load existing thoughts（先用缓存同步显示，再异步刷新）
  useEffect(() => {
    // 1. 先从缓存里读，立刻显示，避免每次点击都白屏/卡顿
    const cached = thoughtCache.get(highlightId)
    if (cached && cached.length > 0) {
      setExistingThoughts(cached)
    }

    // 2. 再异步请求最新数据，如果有变化再更新
    const loadThoughts = async () => {
      try {
        const response = await fetch(`/api/thoughts?highlightId=${highlightId}`)
        const data = await response.json()
        if (response.ok && data.thoughts) {
          const newThoughts: Thought[] = data.thoughts

          // 对比缓存，只有在有新增/变化时才更新 state，避免不必要的重渲染
          const prev = thoughtCache.get(highlightId) || []
          const isSame =
            prev.length === newThoughts.length &&
            prev.every((p, idx) => p.id === newThoughts[idx].id && p.content === newThoughts[idx].content)

          if (!isSame) {
            thoughtCache.set(highlightId, newThoughts)
            setExistingThoughts(newThoughts)
          }

          // 为这些想法的作者预加载昵称（包括自己和他人）
          const userIds = Array.from(new Set(newThoughts.map(t => t.user_id).filter(Boolean))) as string[]
          if (userIds.length > 0) {
            ;(async () => {
              const entries: [string, string][] = []
              for (const uid of userIds) {
                const name = uid === currentDeviceId
                  ? (getDeviceId(), await ensureNickname())
                  : (await fetchNicknameForDevice(uid)) || '一位读者'
                entries.push([uid, name])
              }
              setNicknameMap(prev => ({ ...prev, ...Object.fromEntries(entries) }))
            })()
          }
        }
      } catch (error) {
        console.error('Failed to load thoughts:', error)
      }
    }
    loadThoughts()
  }, [highlightId])

  // Auto focus textarea
  useEffect(() => {
    if (textareaRef.current && !editingId) {
      textareaRef.current.focus()
    }
  }, [editingId])

  const handleSave = async () => {
    const content = thought.trim()
    if (!content) return

    // 确保当前用户已有昵称（会在需要时弹出 prompt）
    await ensureNickname()

    // 乐观更新：先在本地插入一条“临时想法”，立刻反馈给用户
    const tempId = `temp-${Date.now()}`
    const optimisticThought: Thought = {
      id: tempId,
      highlight_id: highlightId,
      content,
      created_at: new Date().toISOString(),
      user_id: currentDeviceId,
    }

    setExistingThoughts((prev) => {
      const updated = [optimisticThought, ...prev]
      thoughtCache.set(highlightId, updated)
      return updated
    })
    setThought('') // 立即清空输入框，感觉更“秒发”

    setLoading(true)
    try {
      const deviceId = getDeviceId()
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          highlightId,
          storyId,
          content,
          deviceId
        }),
      })

      const data = await response.json()

      if (response.ok && data.thought) {
        // 用服务端返回的真实数据替换临时想法
        setExistingThoughts(prev => {
          const replaced = prev.map(t => (t.id === tempId ? data.thought : t))
          thoughtCache.set(highlightId, replaced)
          return replaced
        })
        onThoughtSaved()
      } else {
        // 失败时撤回临时想法，并把内容放回输入框，提示用户
        setExistingThoughts(prev => {
          const reverted = prev.filter(t => t.id !== tempId)
          thoughtCache.set(highlightId, reverted)
          return reverted
        })
        setThought(content)
        if (data?.error) {
          alert(data.error)
        }
      }
    } catch (error) {
      console.error('Failed to save thought:', error)
      // 网络错误同样撤回临时想法
      setExistingThoughts(prev => {
        const reverted = prev.filter(t => t.id !== tempId)
        thoughtCache.set(highlightId, reverted)
        return reverted
      })
      setThought(content)
      alert('保存失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (thoughtId: string) => {
    const content = editContent.trim()
    if (!content) {
      setEditingId(null)
      return
    }

    setLoading(true)
    try {
      const deviceId = getDeviceId()
      const response = await fetch('/api/thoughts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thoughtId,
          content,
          deviceId
        }),
      })

      const data = await response.json()

      if (response.ok && data.thought) {
        setExistingThoughts(prev => {
          const updated = prev.map(t => (t.id === thoughtId ? data.thought : t))
          thoughtCache.set(highlightId, updated)
          return updated
        })
        setEditingId(null)
        setEditContent('')
      } else {
        alert(data.error || '更新失败')
      }
    } catch (error) {
      console.error('Failed to update thought:', error)
      alert('更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (thoughtId: string) => {
    try {
      const deviceId = getDeviceId()
      const response = await fetch('/api/thoughts', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thoughtId, deviceId }),
      })

      if (response.ok) {
        setExistingThoughts(prev => {
          const updated = prev.filter(t => t.id !== thoughtId)
          thoughtCache.set(highlightId, updated)
          return updated
        })
      } else {
        const data = await response.json()
        alert(data.error || '删除失败')
      }
    } catch (error) {
      console.error('Failed to delete thought:', error)
      alert('删除失败，请稍后重试')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-80 max-w-[90vw]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px'
      }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">发布想法</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Thoughts */}
        {existingThoughts.length > 0 && (
          <div className="mb-3 space-y-2 max-h-40 overflow-y-auto">
            {existingThoughts.map((t) => (
              <div
                key={t.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2 text-sm"
              >
                {editingId === t.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => {
                        if (e.target.value.length <= 500) {
                          setEditContent(e.target.value)
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      rows={2}
                      maxLength={500}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(t.id)}
                        className="flex-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* XSS 防护：React 会自动转义，但为了安全，确保内容已清理 */}
                    <p className="text-gray-700 dark:text-gray-300 mb-1 whitespace-pre-wrap break-words">
                      {t.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {nicknameMap[t.user_id || ''] || (t.user_id === currentDeviceId ? '我' : '一位读者')} · {formatDate(t.created_at)}
                      </span>
                      {/* 只有主人可以编辑和删除想法 */}
                      {t.user_id === currentDeviceId && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingId(t.id)
                              setEditContent(t.content)
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                            title="编辑"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={thought}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setThought(e.target.value)
              }
            }}
            placeholder="写下你的想法..."
            className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={3}
            maxLength={500}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSave()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {thought.length} / 500
            </span>
            <button
              onClick={handleSave}
              disabled={loading || !thought.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Send className="w-3 h-3" />
              发布
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

