/**
 * API Route Tests
 * Note: These are integration tests that test the API route handlers
 */

import { POST } from '@/app/api/generate/route'
import { supabaseAdmin } from '@/lib/supabase'

// Mock NextRequest
class MockNextRequest {
  url: string
  method: string
  headers: Headers
  body: any

  constructor(url: string, init: any = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }

  get nextUrl() {
    return {
      searchParams: new URLSearchParams(),
    }
  }
}

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  getClientIdentifier: jest.fn(() => 'device:test-device'),
  checkRateLimitDB: jest.fn(() => Promise.resolve({ allowed: true, remaining: 10, resetTime: Date.now() + 3600000 })),
  createRateLimitResponse: jest.fn(),
  RATE_LIMIT_CONFIGS: {},
  checkRequestSize: jest.fn(() => true),
  getRequestSizeLimit: jest.fn(() => 1024),
}))

describe('POST /api/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.DEEPSEEK_API_KEY = 'test-api-key'
    process.env.DAILY_STORY_LIMIT = '5'
  })

  it('should return 400 for missing words', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'test-device' }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('请输入1-3个字')
  })

  it('should return 400 for missing deviceId', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ words: '测试' }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('缺少设备ID')
  })

  it('should return 400 for words longer than 3 characters', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ words: '测试文字过长', deviceId: 'test-device' }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('请输入1-3个字')
  })

  it('should return 500 when DeepSeek API key is missing', async () => {
    delete process.env.DEEPSEEK_API_KEY

    // Mock database query
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockGte = jest.fn().mockReturnThis()
    const mockLt = jest.fn().mockResolvedValue({ count: 0, error: null })

    ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lt: mockLt,
    })

    const request = new MockNextRequest('http://localhost:3000/api/generate', {
      method: 'POST',
      body: JSON.stringify({ words: '测试', deviceId: 'test-device' }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toContain('DeepSeek API key 未配置')
  })
})

