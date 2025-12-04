'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type FontFamily = 'system' | 'serif' | 'sans-serif' | 'monospace' | 'kaiti' | 'songti'
export type FontSize = 'small' | 'medium' | 'large' | 'xlarge'
export type ReadingTheme = 'default' | 'paper' | 'eye-care' | 'dark'
export type LineSpacing = 'tight' | 'normal' | 'relaxed' | 'loose'
export type LetterSpacing = 'tight' | 'normal' | 'wide'

interface ReadingSettings {
  fontFamily: FontFamily
  fontSize: FontSize
  theme: ReadingTheme
  lineSpacing: LineSpacing
  letterSpacing: LetterSpacing
  setFontFamily: (font: FontFamily) => void
  setFontSize: (size: FontSize) => void
  setTheme: (theme: ReadingTheme) => void
  setLineSpacing: (spacing: LineSpacing) => void
  setLetterSpacing: (spacing: LetterSpacing) => void
}

const ReadingSettingsContext = createContext<ReadingSettings | undefined>(undefined)

export function ReadingSettingsProvider({ children }: { children: ReactNode }) {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>('system')
  const [fontSize, setFontSizeState] = useState<FontSize>('medium')
  const [theme, setThemeState] = useState<ReadingTheme>('default')
  const [lineSpacing, setLineSpacingState] = useState<LineSpacing>('normal')
  const [letterSpacing, setLetterSpacingState] = useState<LetterSpacing>('normal')

  // Load settings from localStorage
  useEffect(() => {
    const savedFontFamily = localStorage.getItem('readingFontFamily') as FontFamily
    const savedFontSize = localStorage.getItem('readingFontSize') as FontSize
    const savedTheme = localStorage.getItem('readingTheme') as ReadingTheme
    const savedLineSpacing = localStorage.getItem('readingLineSpacing') as LineSpacing
    const savedLetterSpacing = localStorage.getItem('readingLetterSpacing') as LetterSpacing
    
    if (savedFontFamily && ['system', 'serif', 'sans-serif', 'monospace', 'kaiti', 'songti'].includes(savedFontFamily)) {
      setFontFamilyState(savedFontFamily)
    }
    if (savedFontSize && ['small', 'medium', 'large', 'xlarge'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize)
    }
    if (savedTheme && ['default', 'paper', 'eye-care', 'dark'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
    if (savedLineSpacing && ['tight', 'normal', 'relaxed', 'loose'].includes(savedLineSpacing)) {
      setLineSpacingState(savedLineSpacing)
    }
    if (savedLetterSpacing && ['tight', 'normal', 'wide'].includes(savedLetterSpacing)) {
      setLetterSpacingState(savedLetterSpacing)
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

  const setTheme = (newTheme: ReadingTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('readingTheme', newTheme)
  }

  const setLineSpacing = (spacing: LineSpacing) => {
    setLineSpacingState(spacing)
    localStorage.setItem('readingLineSpacing', spacing)
  }

  const setLetterSpacing = (spacing: LetterSpacing) => {
    setLetterSpacingState(spacing)
    localStorage.setItem('readingLetterSpacing', spacing)
  }

  return (
    <ReadingSettingsContext.Provider
      value={{
        fontFamily,
        fontSize,
        theme,
        lineSpacing,
        letterSpacing,
        setFontFamily,
        setFontSize,
        setTheme,
        setLineSpacing,
        setLetterSpacing,
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

// Reading theme mapping (background colors)
// Returns gradient colors for light and dark modes
export const themeMap: Record<ReadingTheme, { light: { from: string; to: string }; dark: { from: string; to: string } }> = {
  default: {
    light: { from: '#ffffff', to: '#f9fafb' },
    dark: { from: '#1f2937', to: '#111827' },
  },
  paper: {
    light: { from: '#FDF6E3', to: '#F5F1E8' },
    dark: { from: '#1f2937', to: '#111827' },
  },
  'eye-care': {
    light: { from: '#F0F8F0', to: '#E8F5E8' },
    dark: { from: '#1f2937', to: '#111827' },
  },
  dark: {
    light: { from: '#1f2937', to: '#111827' },
    dark: { from: '#1f2937', to: '#111827' },
  },
}

// Theme labels
export const themeLabels: Record<ReadingTheme, string> = {
  default: '默认',
  paper: '纸张',
  'eye-care': '护眼',
  dark: '深色',
}

// Line spacing mapping
export const lineSpacingMap: Record<LineSpacing, number> = {
  tight: 1.4,
  normal: 1.6,
  relaxed: 1.8,
  loose: 2.0,
}

// Line spacing labels
export const lineSpacingLabels: Record<LineSpacing, string> = {
  tight: '紧凑',
  normal: '正常',
  relaxed: '宽松',
  loose: '很宽松',
}

// Letter spacing mapping (in em)
export const letterSpacingMap: Record<LetterSpacing, string> = {
  tight: '-0.01em',
  normal: '0',
  wide: '0.02em',
}

// Letter spacing labels
export const letterSpacingLabels: Record<LetterSpacing, string> = {
  tight: '紧凑',
  normal: '正常',
  wide: '宽松',
}


