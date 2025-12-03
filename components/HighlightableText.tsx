'use client'

import { useState, useEffect, useRef, useCallback, ReactElement } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Underline, X, MessageSquare } from 'lucide-react'
import ThoughtInput from './ThoughtInput'
import { getDeviceId } from '@/lib/deviceId'

interface Highlight {
  id: string
  text_content: string
  start_index: number
  end_index: number
  created_at?: string
}

interface HighlightableTextProps {
  text: string
  storyId: string
  className?: string
}

export default function HighlightableText({ text, storyId, className = '' }: HighlightableTextProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null)
  const [showHighlightMenu, setShowHighlightMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [clickedHighlight, setClickedHighlight] = useState<{ id: string; position: { x: number; y: number } } | null>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false)

  // Load highlights from database
  useEffect(() => {
    const loadHighlights = async () => {
      try {
        const response = await fetch(`/api/highlights?storyId=${storyId}`)
        const data = await response.json()
        if (response.ok && data.highlights) {
          setHighlights(data.highlights)
        }
      } catch (error) {
        console.error('Failed to load highlights:', error)
      }
    }
    loadHighlights()
  }, [storyId])

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHighlightMenu && textRef.current && !textRef.current.contains(event.target as Node)) {
        setShowHighlightMenu(false)
        setSelectedRange(null)
        window.getSelection()?.removeAllRanges()
      }
    }

    if (showHighlightMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showHighlightMenu])

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        setSelectedRange(null)
        setShowHighlightMenu(false)
        return
      }

      const range = selection.getRangeAt(0)
      const selectedText = selection.toString().trim()

      if (selectedText.length === 0) {
        setSelectedRange(null)
        setShowHighlightMenu(false)
        return
      }

      // Check if selection is within our text element
      if (!textRef.current?.contains(range.commonAncestorContainer)) {
        setSelectedRange(null)
        setShowHighlightMenu(false)
        return
      }

      // Calculate start and end indices in the original text
      // Use textContent to get the plain text without HTML tags
      const textContent = textRef.current.textContent || ''
      
      // Get the selected text and find its position
      const preSelectionRange = range.cloneRange()
      preSelectionRange.selectNodeContents(textRef.current)
      preSelectionRange.setEnd(range.startContainer, range.startOffset)
      const startIndex = preSelectionRange.toString().length
      
      // Use the actual selected text length (including spaces)
      const actualSelectedText = selection.toString()
      const endIndex = startIndex + actualSelectedText.length

      // Check if this range overlaps with existing highlights
      const overlaps = highlights.some(h => 
        (startIndex >= h.start_index && startIndex < h.end_index) ||
        (endIndex > h.start_index && endIndex <= h.end_index) ||
        (startIndex <= h.start_index && endIndex >= h.end_index)
      )

      if (overlaps) {
        // Don't allow overlapping highlights
        setSelectedRange(null)
        setShowHighlightMenu(false)
        window.getSelection()?.removeAllRanges()
        return
      }

      setSelectedRange({
        start: startIndex,
        end: endIndex,
        text: selectedText
      })

      // Show menu near selection
      const rect = range.getBoundingClientRect()
      setMenuPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      })
      setShowHighlightMenu(true)
    }, 10)
  }, [highlights])

  // Save highlight
  const handleSaveHighlight = async () => {
    if (!selectedRange) return

    try {
      const deviceId = getDeviceId()
      const response = await fetch('/api/highlights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          storyId,
          textContent: selectedRange.text,
          startIndex: selectedRange.start,
          endIndex: selectedRange.end,
          deviceId
        }),
      })

      const data = await response.json()

      if (response.ok && data.highlight) {
        setHighlights(prev => [...prev, data.highlight])
        setSelectedRange(null)
        setShowHighlightMenu(false)
        window.getSelection()?.removeAllRanges()
      }
    } catch (error) {
      console.error('Failed to save highlight:', error)
    }
  }

  // Delete highlight
  const handleDeleteHighlight = async (highlightId: string) => {
    try {
      const response = await fetch('/api/highlights', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ highlightId }),
      })

      if (response.ok) {
        setHighlights(prev => prev.filter(h => h.id !== highlightId))
      }
    } catch (error) {
      console.error('Failed to delete highlight:', error)
    }
  }

  // Render text with highlights
  const renderTextWithHighlights = () => {
    if (highlights.length === 0) {
      return <span>{text}</span>
    }

    // Sort highlights by start index
    const sortedHighlights = [...highlights].sort((a, b) => a.start_index - b.start_index)
    
    const elements: ReactElement[] = []
    let lastIndex = 0

    sortedHighlights.forEach((highlight, index) => {
      // Add text before highlight
      if (highlight.start_index > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, highlight.start_index)}
          </span>
        )
      }

      // Add highlighted text
      const highlightText = text.substring(highlight.start_index, highlight.end_index)
      if (highlightText.length > 0) {
        elements.push(
          <mark
            key={`highlight-${highlight.id}`}
            className="relative group bg-yellow-200 dark:bg-yellow-900/40 text-inherit px-0.5 rounded cursor-pointer"
            style={{
              textDecoration: 'underline',
              textDecorationColor: '#facc15',
              textDecorationThickness: '2px',
              textUnderlineOffset: '2px'
            }}
            title={highlight.text_content}
            onClick={(e) => {
              e.stopPropagation()
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              setClickedHighlight({
                id: highlight.id,
                position: {
                  x: rect.left + rect.width / 2,
                  y: rect.top
                }
              })
            }}
            onMouseDown={(e) => {
              // Prevent text selection when clicking on highlight
              if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'BUTTON') {
                e.preventDefault()
              }
            }}
          >
            {highlightText}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  const rect = (e.currentTarget.parentElement?.parentElement as HTMLElement)?.getBoundingClientRect()
                  if (rect) {
                    setClickedHighlight({
                      id: highlight.id,
                      position: {
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      }
                    })
                  }
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseUp={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="bg-blue-500 text-white rounded-full p-1 shadow-lg hover:bg-blue-600 pointer-events-auto"
                title="发布想法"
              >
                <MessageSquare className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  handleDeleteHighlight(highlight.id)
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseUp={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 pointer-events-auto"
                title="删除划线"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </mark>
        )
      }

      lastIndex = highlight.end_index
    })

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex)}
        </span>
      )
    }

    return <>{elements}</>
  }

  return (
    <div className="relative">
      <div
        ref={textRef}
        onMouseUp={handleMouseUp}
        className={`select-text cursor-text ${className}`}
        style={{ userSelect: 'text' }}
      >
        {renderTextWithHighlights()}
      </div>

      {/* Highlight Menu */}
      <AnimatePresence>
        {showHighlightMenu && selectedRange && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <button
              onClick={handleSaveHighlight}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <Underline className="w-4 h-4" />
              添加下划线
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thought Input */}
      <AnimatePresence>
        {clickedHighlight && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setClickedHighlight(null)}
            />
            <ThoughtInput
              highlightId={clickedHighlight.id}
              storyId={storyId}
              position={clickedHighlight.position}
              onClose={() => setClickedHighlight(null)}
              onThoughtSaved={() => {
                // Optionally refresh highlights or show success message
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

