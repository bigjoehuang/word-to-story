'use client'

import ThemeToggle from './ThemeToggle'
import NicknameBadge from './NicknameBadge'

export default function TopBar() {
  return (
    <div className="flex justify-end items-center gap-3 px-4 pt-4">
      <NicknameBadge />
      <ThemeToggle />
    </div>
  )
}







