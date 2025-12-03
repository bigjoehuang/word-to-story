'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { motion } from 'framer-motion'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="切换主题"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Sun className="w-5 h-5 text-yellow-500" />
      )}
    </motion.button>
  )
}

