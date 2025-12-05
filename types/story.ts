export interface Story {
  id: string
  words: string
  content: string
  likes: number
  created_at: string
  image_url?: string | null
  audio_url?: string | null
  user_id?: string
  author_nickname?: string | null
}

// 使用统一的 Pagination 类型（从 types/api.ts）
export type { Pagination } from './api'

