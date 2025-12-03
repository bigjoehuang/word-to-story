export interface Story {
  id: string
  words: string
  content: string
  likes: number
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

