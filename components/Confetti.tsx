'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface ConfettiProps {
  onComplete?: () => void
}

export default function Confetti({ onComplete }: ConfettiProps) {
  // 生成多个撒花粒子
  const particles = Array.from({ length: 30 }, (_, i) => i)
  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    // 设置一个定时器，在动画结束后调用 onComplete
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, 2500) // 最长动画时间约2.5秒

    return () => clearTimeout(timer)
  }, [onComplete])

  const handleParticleComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1
      // 当所有粒子都完成时，调用 onComplete
      if (newCount >= particles.length && onComplete) {
        // 延迟一点再调用，确保动画完全结束
        setTimeout(() => onComplete(), 100)
      }
      return newCount
    })
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((i) => {
        // 更随机的角度和距离，让撒花效果更自然
        const angle = (Math.random() * 360) * (Math.PI / 180)
        const distance = 150 + Math.random() * 150
        const x = Math.cos(angle) * distance
        const y = Math.sin(angle) * distance
        const delay = Math.random() * 0.2
        const duration = 1.8 + Math.random() * 0.7

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            initial={{ 
              opacity: 0,
              scale: 0,
              x: 0,
              y: 0,
              rotate: 0
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.3, 1, 0.6],
              x: x,
              y: y,
              rotate: 180 + Math.random() * 360
            }}
            transition={{
              duration: duration,
              delay: delay,
              ease: [0.25, 0.46, 0.45, 0.94] // 更平滑的缓动
            }}
            onAnimationComplete={handleParticleComplete}
          >
            <Sparkles 
              className={`w-6 h-6 drop-shadow-lg ${
                i % 4 === 0 ? 'text-yellow-400' :
                i % 4 === 1 ? 'text-pink-400' :
                i % 4 === 2 ? 'text-blue-400' :
                'text-purple-400'
              }`}
            />
          </motion.div>
        )
      })}
    </div>
  )
}

