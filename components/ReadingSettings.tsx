'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Type, Minus, Plus, ChevronDown } from 'lucide-react'
import { 
  useReadingSettings, 
  fontFamilyLabels, 
  fontSizeLabels,
  themeLabels,
  lineSpacingLabels,
  letterSpacingLabels,
  FontFamily, 
  FontSize,
  ReadingTheme,
  LineSpacing,
  LetterSpacing
} from '@/lib/readingSettings'

export default function ReadingSettings() {
  const { 
    fontFamily, 
    fontSize, 
    theme,
    lineSpacing,
    letterSpacing,
    setFontFamily, 
    setFontSize,
    setTheme,
    setLineSpacing,
    setLetterSpacing
  } = useReadingSettings()
  const [showMenu, setShowMenu] = useState(false)

  const fontFamilies: FontFamily[] = ['system', 'serif', 'sans-serif', 'monospace', 'kaiti', 'songti']
  const fontSizes: FontSize[] = ['small', 'medium', 'large', 'xlarge']
  const themes: ReadingTheme[] = ['default', 'paper', 'eye-care', 'dark']
  const lineSpacings: LineSpacing[] = ['tight', 'normal', 'relaxed', 'loose']
  const letterSpacings: LetterSpacing[] = ['tight', 'normal', 'wide']

  const handleFontSizeDecrease = () => {
    const currentIndex = fontSizes.indexOf(fontSize)
    if (currentIndex > 0) {
      setFontSize(fontSizes[currentIndex - 1])
    }
  }

  const handleFontSizeIncrease = () => {
    const currentIndex = fontSizes.indexOf(fontSize)
    if (currentIndex < fontSizes.length - 1) {
      setFontSize(fontSizes[currentIndex + 1])
    }
  }

  return (
    <div className="fixed top-16 right-20 z-50">
      <div className="relative">
        <motion.button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="阅读设置"
        >
          <Type className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline whitespace-nowrap">
            {fontFamilyLabels[fontFamily]} · {fontSizeLabels[fontSize]}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ${showMenu ? 'rotate-180' : ''}`} />
        </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-y-auto"
              style={{ 
                top: '100%',
                maxHeight: 'calc(100vh - 6rem)',
              }}
            >
              {/* Reading Theme Selection */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">阅读主题</h3>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <motion.button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        theme === t
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {themeLabels[t]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">字体</h3>
                <div className="grid grid-cols-2 gap-2">
                  {fontFamilies.map((font) => (
                    <motion.button
                      key={font}
                      onClick={() => setFontFamily(font)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        fontFamily === font
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {fontFamilyLabels[font]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Font Size Control */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">字号</h3>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleFontSizeDecrease}
                    disabled={fontSize === 'small'}
                    className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: fontSize !== 'small' ? 1.1 : 1 }}
                    whileTap={{ scale: fontSize !== 'small' ? 0.9 : 1 }}
                  >
                    <Minus className="w-4 h-4" />
                  </motion.button>
                  
                  <div className="flex-1 flex items-center justify-center gap-2">
                    <span className="text-lg font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-center">
                      {fontSizeLabels[fontSize]}
                    </span>
                  </div>

                  <motion.button
                    onClick={handleFontSizeIncrease}
                    disabled={fontSize === 'xlarge'}
                    className="p-2 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    whileHover={{ scale: fontSize !== 'xlarge' ? 1.1 : 1 }}
                    whileTap={{ scale: fontSize !== 'xlarge' ? 0.9 : 1 }}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Line Spacing Control */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">行间距</h3>
                <div className="grid grid-cols-2 gap-2">
                  {lineSpacings.map((spacing) => (
                    <motion.button
                      key={spacing}
                      onClick={() => setLineSpacing(spacing)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        lineSpacing === spacing
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {lineSpacingLabels[spacing]}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Letter Spacing Control */}
              <div className="p-4 pb-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">字间距</h3>
                <div className="grid grid-cols-3 gap-2">
                  {letterSpacings.map((spacing) => (
                    <motion.button
                      key={spacing}
                      onClick={() => setLetterSpacing(spacing)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        letterSpacing === spacing
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {letterSpacingLabels[spacing]}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

