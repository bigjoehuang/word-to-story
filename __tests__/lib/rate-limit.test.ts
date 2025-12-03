import {
  getClientIdentifier,
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  checkRequestSize,
  getRequestSizeLimit,
} from '@/lib/rate-limit'

// Mock NextRequest
class MockNextRequest {
  url: string
  headers: Headers

  constructor(url: string, init: any = {}) {
    this.url = url
    this.headers = new Headers(init.headers || {})
  }
}

describe('getClientIdentifier', () => {
  it('should use deviceId when provided', () => {
    const request = new MockNextRequest('http://localhost:3000')
    const identifier = getClientIdentifier(request as any, 'test-device-id')
    expect(identifier).toBe('device:test-device-id')
  })

  it('should use IP when deviceId is not provided', () => {
    const request = new MockNextRequest('http://localhost:3000', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    })
    const identifier = getClientIdentifier(request as any)
    expect(identifier).toBe('ip:192.168.1.1')
  })

  it('should use x-real-ip when x-forwarded-for is not available', () => {
    const request = new MockNextRequest('http://localhost:3000', {
      headers: {
        'x-real-ip': '10.0.0.1',
      },
    })
    const identifier = getClientIdentifier(request as any)
    expect(identifier).toBe('ip:10.0.0.1')
  })

  it('should use "unknown" when no IP is available', () => {
    const request = new MockNextRequest('http://localhost:3000')
    const identifier = getClientIdentifier(request as any)
    expect(identifier).toBe('ip:unknown')
  })
})

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    jest.clearAllMocks()
  })

  it('should allow request within limit', async () => {
    const identifier = 'test-identifier'
    const config = {
      windowMs: 60000, // 1 minute
      maxRequests: 10,
    }

    const result = await checkRateLimit(identifier, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('should reject request exceeding limit', async () => {
    const identifier = 'test-identifier-2'
    const config = {
      windowMs: 60000,
      maxRequests: 2,
    }

    // Make requests up to limit
    await checkRateLimit(identifier, config)
    await checkRateLimit(identifier, config)

    // This should be rejected
    const result = await checkRateLimit(identifier, config)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

describe('checkRequestSize', () => {
  it('should return true for requests within size limit', () => {
    const request = new MockNextRequest('http://localhost:3000', {
      headers: {
        'content-length': '500',
      },
    })
    expect(checkRequestSize(request as any, 1000)).toBe(true)
  })

  it('should return false for requests exceeding size limit', () => {
    const request = new MockNextRequest('http://localhost:3000', {
      headers: {
        'content-length': '2000',
      },
    })
    expect(checkRequestSize(request as any, 1000)).toBe(false)
  })

  it('should return true when content-length is not set', () => {
    const request = new MockNextRequest('http://localhost:3000')
    expect(checkRequestSize(request as any, 1000)).toBe(true)
  })
})

describe('getRequestSizeLimit', () => {
  it('should return correct limit for known endpoints', () => {
    expect(getRequestSizeLimit('/api/generate')).toBe(1024)
    expect(getRequestSizeLimit('/api/generate-image')).toBe(10 * 1024)
    expect(getRequestSizeLimit('/api/highlights')).toBe(5 * 1024)
  })

  it('should return default limit for unknown endpoints', () => {
    expect(getRequestSizeLimit('/api/unknown')).toBe(1024 * 1024)
  })
})

describe('RATE_LIMIT_CONFIGS', () => {
  it('should have correct configuration for GENERATE_STORY', () => {
    expect(RATE_LIMIT_CONFIGS.GENERATE_STORY.windowMs).toBe(60 * 60 * 1000)
    expect(RATE_LIMIT_CONFIGS.GENERATE_STORY.maxRequests).toBe(10)
  })

  it('should have correct configuration for HIGHLIGHT', () => {
    expect(RATE_LIMIT_CONFIGS.HIGHLIGHT.windowMs).toBe(60 * 1000)
    expect(RATE_LIMIT_CONFIGS.HIGHLIGHT.maxRequests).toBe(30)
  })
})

