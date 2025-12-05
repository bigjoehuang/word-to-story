'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

// 音效生成函数
function playSoundEffect(type: 'ding' | 'biu' | 'pop' | 'chime' | 'sparkle') {
  try {
    // 检查浏览器是否支持 Web Audio API
    if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) {
      return
    }
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    const audioContext = new AudioContextClass()
    
    // 如果音频上下文被暂停（需要用户交互），尝试恢复
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {
        // 如果恢复失败，静默失败
        return
      })
    }
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // 根据类型设置不同的音效
    switch (type) {
      case 'ding': {
        // 清脆的"叮"声 - 高音，快速衰减，轻微音量
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime) // 降低音量
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        break
      }
      
      case 'biu': {
        // 轻快的"biu"声 - 上升音调，轻微音量
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.2)
        
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime) // 降低音量
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.25)
        break
      }
      
      case 'pop': {
        // 爆裂声 - 短促的爆破音，轻微音量
        oscillator.type = 'square'
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1)
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime) // 降低音量
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.15)
        break
      }
      
      case 'chime': {
        // 钟声 - 柔和的音调，轻微音量
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
        
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime) // 降低音量
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.5)
        break
      }
      
      case 'sparkle': {
        // 闪烁音 - 快速的高音，轻微音量
        oscillator.type = 'sine'
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(1500, audioContext.currentTime + 0.15)
        
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime) // 降低音量
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      }
    }
    
    // 清理资源
    oscillator.onended = () => {
      audioContext.close()
    }
  } catch (error) {
    // 静默失败，不影响动画
    console.debug('音效播放失败:', error)
  }
}

interface ConfettiProps {
  onComplete?: () => void
}

type EffectType = 
  | 'explosion'      // 中心爆炸
  | 'rain'           // 从顶部飘落
  | 'rise'           // 从底部飞起
  | 'spiral'         // 螺旋扩散
  | 'wave'           // 波浪式
  | 'symmetric'      // 左右对称
  | 'circle'         // 圆形旋转
  | 'random'         // 随机分布

interface ParticleConfig {
  initialX: number
  initialY: number
  finalX: number
  finalY: number
  rotate: number
  delay: number
  duration: number
}

export default function Confetti({ onComplete }: ConfettiProps) {
  // 随机选择一种效果类型
  const effectType = useMemo<EffectType>(() => {
    const effects: EffectType[] = [
      'explosion',
      'rain',
      'rise',
      'spiral',
      'wave',
      'symmetric',
      'circle',
      'random'
    ]
    return effects[Math.floor(Math.random() * effects.length)]
  }, [])

  // 根据效果类型选择匹配的音效
  const soundType = useMemo<'ding' | 'biu' | 'pop' | 'chime' | 'sparkle'>(() => {
    // 根据效果类型选择更匹配的音效
    const soundMap: Record<EffectType, ('ding' | 'biu' | 'pop' | 'chime' | 'sparkle')[]> = {
      'explosion': ['pop', 'ding'],
      'rain': ['chime', 'sparkle'],
      'rise': ['biu', 'sparkle'],
      'spiral': ['chime', 'ding'],
      'wave': ['sparkle', 'chime'],
      'symmetric': ['ding', 'chime'],
      'circle': ['chime', 'sparkle'],
      'random': ['ding', 'biu', 'pop', 'chime', 'sparkle']
    }
    
    const availableSounds = soundMap[effectType]
    return availableSounds[Math.floor(Math.random() * availableSounds.length)]
  }, [effectType])

  // 播放音效
  useEffect(() => {
    // 延迟一点播放，让动画和音效更同步
    const timer = setTimeout(() => {
      playSoundEffect(soundType)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [soundType])

  // 根据效果类型生成粒子配置
  const particles = useMemo(() => {
    const count = 28 // 保持合理的粒子数量以确保性能
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 800
    
    return Array.from({ length: count }, (_, i) => {
      const baseDelay = Math.random() * 0.2
      const baseDuration = 1.8 + Math.random() * 0.7

      switch (effectType) {
        case 'explosion': {
          // 中心爆炸：从中心向四周扩散
          const angle = (Math.random() * 360) * (Math.PI / 180)
          const distance = 150 + Math.random() * 150
          return {
            initialX: 0,
            initialY: 0,
            finalX: Math.cos(angle) * distance,
            finalY: Math.sin(angle) * distance,
            rotate: 180 + Math.random() * 360,
            delay: baseDelay,
            duration: baseDuration
          }
        }

        case 'rain': {
          // 从顶部飘落
          const startX = (Math.random() - 0.5) * screenWidth * 0.8
          const endX = startX + (Math.random() - 0.5) * 100
          const endY = 200 + Math.random() * 200
          return {
            initialX: startX,
            initialY: -100,
            finalX: endX,
            finalY: endY,
            rotate: 360 + Math.random() * 180,
            delay: baseDelay,
            duration: baseDuration
          }
        }

        case 'rise': {
          // 从底部飞起
          const startX = (Math.random() - 0.5) * screenWidth * 0.8
          const endX = startX + (Math.random() - 0.5) * 100
          const endY = -200 - Math.random() * 200
          return {
            initialX: startX,
            initialY: 100,
            finalX: endX,
            finalY: endY,
            rotate: -360 - Math.random() * 180,
            delay: baseDelay,
            duration: baseDuration
          }
        }

        case 'spiral': {
          // 螺旋扩散
          const angle = (i / count) * 360 * 3 // 3圈螺旋
          const radius = 50 + (i / count) * 200
          const angleRad = (angle * Math.PI) / 180
          return {
            initialX: 0,
            initialY: 0,
            finalX: Math.cos(angleRad) * radius,
            finalY: Math.sin(angleRad) * radius,
            rotate: angle * 2,
            delay: (i / count) * 0.3,
            duration: baseDuration
          }
        }

        case 'wave': {
          // 波浪式：从中心向两侧波浪扩散
          const side = i % 2 === 0 ? 1 : -1
          const waveIndex = Math.floor(i / 2)
          const wavePhase = (waveIndex / (count / 2)) * Math.PI * 2
          const distance = 100 + waveIndex * 15
          return {
            initialX: 0,
            initialY: 0,
            finalX: side * distance * Math.cos(wavePhase),
            finalY: distance * Math.sin(wavePhase),
            rotate: side * 360,
            delay: waveIndex * 0.05,
            duration: baseDuration
          }
        }

        case 'symmetric': {
          // 左右对称
          const side = i % 2 === 0 ? 1 : -1
          const angle = ((Math.floor(i / 2) / (count / 2)) * 180) * (Math.PI / 180)
          const distance = 120 + Math.random() * 100
          return {
            initialX: 0,
            initialY: 0,
            finalX: side * Math.cos(angle) * distance,
            finalY: Math.sin(angle) * distance,
            rotate: side * (180 + Math.random() * 180),
            delay: baseDelay,
            duration: baseDuration
          }
        }

        case 'circle': {
          // 圆形旋转：粒子沿圆形路径
          const angle = (i / count) * 360 * (Math.PI / 180)
          const radius = 150 + Math.random() * 50
          return {
            initialX: 0,
            initialY: 0,
            finalX: Math.cos(angle) * radius,
            finalY: Math.sin(angle) * radius,
            rotate: 360 + (i / count) * 720,
            delay: baseDelay,
            duration: baseDuration
          }
        }

        case 'random':
        default: {
          // 随机分布
          const angle = Math.random() * 360 * (Math.PI / 180)
          const distance = 100 + Math.random() * 200
          return {
            initialX: (Math.random() - 0.5) * 100,
            initialY: (Math.random() - 0.5) * 100,
            finalX: Math.cos(angle) * distance,
            finalY: Math.sin(angle) * distance,
            rotate: Math.random() * 720,
            delay: Math.random() * 0.4,
            duration: baseDuration
          }
        }
      }
    })
  }, [effectType])

  const [completedCount, setCompletedCount] = useState(0)

  useEffect(() => {
    // 设置一个定时器，在动画结束后调用 onComplete
    const maxDuration = Math.max(...particles.map(p => p.delay + p.duration))
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete()
      }
    }, (maxDuration + 0.3) * 1000) // 最长动画时间 + 缓冲

    return () => clearTimeout(timer)
  }, [onComplete, particles])

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

  // 颜色数组
  const colors = ['text-yellow-400', 'text-pink-400', 'text-blue-400', 'text-purple-400', 'text-green-400', 'text-orange-400']

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle, i) => {
        const color = colors[i % colors.length]
        
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2"
            initial={{ 
              opacity: 0,
              scale: 0,
              x: particle.initialX,
              y: particle.initialY,
              rotate: 0
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.3, 1, 0.6],
              x: particle.finalX,
              y: particle.finalY,
              rotate: particle.rotate
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: [0.25, 0.46, 0.45, 0.94] // 平滑的缓动
            }}
            onAnimationComplete={handleParticleComplete}
          >
            <Sparkles 
              className={`w-6 h-6 drop-shadow-lg ${color}`}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
