import { POST, GET, DELETE } from '@/app/api/highlights/route'
import { supabaseAdmin } from '@/lib/supabase'

// Mock NextRequest
class MockNextRequest {
  url: string
  method: string
  headers: Headers
  body: any
  nextUrl: { searchParams: URLSearchParams }

  constructor(url: string, init: any = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Headers(init.headers || {})
    this.body = init.body
    this.nextUrl = {
      searchParams: new URLSearchParams(),
    }
  }

  async json() {
    return JSON.parse(this.body || '{}')
  }
}

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

jest.mock('@/lib/rate-limit', () => ({
  getClientIdentifier: jest.fn(() => 'device:test-device'),
  checkRateLimitDB: jest.fn(() => Promise.resolve({ allowed: true, remaining: 30, resetTime: Date.now() + 60000 })),
  createRateLimitResponse: jest.fn(),
  RATE_LIMIT_CONFIGS: {},
  checkRequestSize: jest.fn(() => true),
  getRequestSizeLimit: jest.fn(() => 5 * 1024),
}))

describe('POST /api/highlights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 for missing storyId', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({
        textContent: 'test',
        startIndex: 0,
        endIndex: 4,
        deviceId: 'test-device',
      }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('无效的故事ID')
  })

  it('should return 400 for missing textContent', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({
        storyId: '123e4567-e89b-12d3-a456-426614174000',
        startIndex: 0,
        endIndex: 4,
        deviceId: 'test-device',
      }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('文本内容不能为空')
  })

  it('should return 400 for invalid index range', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/highlights', {
      method: 'POST',
      body: JSON.stringify({
        storyId: '123e4567-e89b-12d3-a456-426614174000',
        textContent: 'test',
        startIndex: 10,
        endIndex: 5,
        deviceId: 'test-device',
      }),
    }) as any

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('无效的索引范围')
  })
})

describe('GET /api/highlights', () => {
  it('should return 400 for missing storyId', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/highlights', {
      method: 'GET',
    }) as any

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('缺少或无效的 storyId 参数')
  })
})

describe('DELETE /api/highlights', () => {
  it('should return 400 for missing highlightId', async () => {
    const request = new MockNextRequest('http://localhost:3000/api/highlights', {
      method: 'DELETE',
      body: JSON.stringify({ deviceId: 'test-device' }),
    }) as any

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('缺少或无效的 highlightId 参数')
  })
})

