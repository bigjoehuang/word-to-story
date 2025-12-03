'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Compass } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="mb-8">
      <div className="flex items-center justify-center gap-4">
        <Link href="/">
          <motion.button
            className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              pathname === '/'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-4 h-4" />
            创作
          </motion.button>
        </Link>
        <Link href="/explore">
          <motion.button
            className={`px-6 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
              pathname === '/explore'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Compass className="w-4 h-4" />
            探索
          </motion.button>
        </Link>
      </div>
    </nav>
  )
}

