/**
 * 集成测试 - 使用真实的 API 和数据库
 * 这些测试会实际调用 API 端点，需要：
 * 1. 运行中的数据库连接
 * 2. 有效的环境变量
 * 3. 可能需要测试数据库
 * 
 * 运行方式：
 * npm test -- generate.integration.test.ts
 * 
 * 注意：这些测试可能会修改数据库，建议使用测试数据库
 */

import { POST } from '@/app/api/generate/route'

// 只在有测试环境变量时运行集成测试
const shouldRunIntegrationTests = 
  process.env.RUN_INTEGRATION_TESTS === 'true' &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.DEEPSEEK_API_KEY

// 跳过测试如果没有配置
const describeIf = shouldRunIntegrationTests ? describe : describe.skip

describeIf('POST /api/generate - Integration Tests', () => {
  // 使用真实的 NextRequest
  const createRequest = (body: any) => {
    return new Request('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }) as any
  }

  it('should generate a story with valid input', async () => {
    const request = createRequest({
      words: '测试',
      deviceId: `test-device-${Date.now()}`,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.story).toBeDefined()
    expect(data.story.words).toBe('测试')
    expect(data.story.content).toBeTruthy()
  }, 30000) // 30秒超时，因为需要调用外部 API

  it('should return 400 for invalid input', async () => {
    const request = createRequest({
      words: '',
      deviceId: 'test-device',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should enforce daily limit', async () => {
    const deviceId = `test-device-limit-${Date.now()}`
    const request = createRequest({
      words: '测试',
      deviceId,
    })

    // 创建多个请求直到达到限制
    let lastResponse
    for (let i = 0; i < 10; i++) {
      lastResponse = await POST(request)
      const data = await lastResponse.json()
      
      if (lastResponse.status === 429) {
        expect(data.error).toContain('今日创作次数已用完')
        break
      }
    }
  }, 60000) // 60秒超时
})








