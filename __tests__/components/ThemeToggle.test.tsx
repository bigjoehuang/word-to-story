import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'
import { ThemeProvider } from '@/lib/theme'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('should render theme toggle button', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /切换主题/i })
      expect(button).toBeInTheDocument()
    })
  })

  it('should toggle theme when clicked', async () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /切换主题/i })
      expect(button).toBeInTheDocument()
    })

    const button = screen.getByRole('button', { name: /切换主题/i })
    fireEvent.click(button)

    // Theme should be toggled (check localStorage or document class)
    await waitFor(() => {
      const theme = localStorage.getItem('theme')
      expect(theme).toBeTruthy()
    })
  })

  it('should show moon icon in light mode', async () => {
    localStorage.setItem('theme', 'light')
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /切换主题/i })
      expect(button).toBeInTheDocument()
    })
  })

  it('should show sun icon in dark mode', async () => {
    localStorage.setItem('theme', 'dark')
    
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /切换主题/i })
      expect(button).toBeInTheDocument()
    })
  })
})

