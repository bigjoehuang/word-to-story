'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type FontFamily = 'system' | 'serif' | 'sans-serif' | 'monospace' | 'kaiti' | 'songti'
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge'

interface ReadingSettings {
  fontFamily: FontFamily
  fontSize: FontSize
  setFontFamily: (font: FontFamily) => void
  setFontSize: (size: FontSize) => void
}

const ReadingSettingsContext = createContext<ReadingSettings | undefined>(undefined)

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('system')
  const [fontSize, setFontSizeState] = useState<FontSize>('medium')

  // Load settings from localStorage
  useEffect(() => {
    const savedFontFamily = localStorage.getItem('readingFontFamily') as FontFamily
    const savedFontSize = localStorage.getItem('readingFontSize') as FontSize
    
    if (savedFontFamily && ['system', 'serif', 'sans-serif', 'monospace', 'kaiti', 'songti'].includes(savedFontFamily)) {
      setFontFamilyState(savedFontFamily)
    }
    if (savedFontSize && ['small', 'medium', 'large', 'xlarge'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize)
    }
  }, [])

  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font)
    localStorage.setItem('readingFontFamily', font)
  }

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size)
    localStorage.setItem('readingFontSize', size)
  }

  return (
    <ReadingSettingsContext.Provider
      value={{
        fontFamily,
        fontSize,
        setFontFamily,
        setFontSize,
      }}
    >
      {children}
    </ReadingSettingsContext.Provider>
  )
}

export function useReadingSettings() {
  const context = useContext(ReadingSettingsContext)
  if (context === undefined) {
    throw new Error('useReadingSettings must be used within a ReadingSettingsProvider')
  }
  return context
}

// Font family mapping
export const fontFamilyMap: Record<FontFamily, string> = {
  system: 'system-ui, -apple-system, sans-serif',
  serif: '"Times New Roman", "Songti SC", "SimSun", serif',
  'sans-serif': '"Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif',
  monospace: '"Courier New", "Consolas", monospace',
  kaiti: '"KaiTi", "楷体", "STKaiti", serif',
  songti: '"Songti SC", "宋体", "SimSun", serif',
}

// Font size mapping (in rem)
export const fontSizeMap: Record<FontSize, string> = {
  small: '0.875rem',    // 14px
  medium: '1rem',       // 16px
  large: '1.125rem',    // 18px
  xlarge: '1.25rem',    // 20px
}

// Font size labels
export const fontSizeLabels: Record<FontSize, string> = {
  small: '小',
  medium: '中',
  large: '大',
  xlarge: '超大',
}

// Font family labels
export const fontFamilyLabels: Record<FontFamily, string> = {
  system: '系统默认',
  serif: '衬线',
  'sans-serif': '无衬线',
  monospace: '等宽',
  kaiti: '楷体',
  songti: '宋体',
}

