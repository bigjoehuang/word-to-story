/**
 * API 通用类型定义
 */

export interface ApiResponse<T = any> {
  success?: boolean
  error?: string
  data?: T
  [key: string]: any
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 向后兼容
export type PaginationResponse = Pagination

export interface DailyLimitResponse {
  limit: number
  used: number
  remaining: number
}

export interface WordCount {
  word: string
  count: number
}

export interface StoriesByWordResponse {
  word: string
  stories: any[]
  count: number
}

