'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // 立即应用主题，避免闪烁
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      const initialTheme: Theme = (savedTheme === 'dark' || savedTheme === 'light') 
        ? savedTheme 
        : (prefersDark ? 'dark' : 'light')
      
      setTheme(initialTheme)
      applyTheme(initialTheme)
    } catch (error) {
      console.error('Error initializing theme:', error)
      // 默认使用浅色主题
      setTheme('light')
      applyTheme('light')
    } finally {
      setMounted(true)
    }
  }, [])

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return
    
    try {
      const root = document.documentElement
      
      // 直接操作，确保立即生效
      if (newTheme === 'dark') {
        root.classList.add('dark')
        root.setAttribute('data-theme', 'dark')
        // 确保 body 也有 dark 类
        document.body.classList.add('dark')
      } else {
        root.classList.remove('dark')
        root.setAttribute('data-theme', 'light')
        document.body.classList.remove('dark')
      }
      
      // 强制触发重绘
      root.style.colorScheme = newTheme === 'dark' ? 'dark' : 'light'
      
      // 调试信息
      console.log('Theme applied:', newTheme)
      console.log('HTML classes:', root.className)
      console.log('HTML has dark class:', root.classList.contains('dark'))
      console.log('Body has dark class:', document.body.classList.contains('dark'))
      console.log('Computed background:', window.getComputedStyle(document.body).backgroundColor)
      console.log('Computed color:', window.getComputedStyle(document.body).color)
      
      // 检查 Tailwind dark mode 是否工作
      const testEl = document.createElement('div')
      testEl.className = 'bg-white dark:bg-gray-800'
      testEl.style.position = 'absolute'
      testEl.style.visibility = 'hidden'
      document.body.appendChild(testEl)
      const computed = window.getComputedStyle(testEl)
      console.log('Test element background (should change with theme):', computed.backgroundColor)
      document.body.removeChild(testEl)
    } catch (error) {
      console.error('Error applying theme:', error)
    }
  }

  const toggleTheme = () => {
    try {
      // 先获取当前主题
      const currentTheme = theme
      const newTheme = currentTheme === 'light' ? 'dark' : 'light'
      
      // 立即应用主题到DOM
      applyTheme(newTheme)
      
      // 保存到localStorage
      localStorage.setItem('theme', newTheme)
      
      // 更新状态
      setTheme(newTheme)
    } catch (error) {
      console.error('Error toggling theme:', error)
    }
  }

  // Always provide context, even when not mounted
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

