/**
 * 高亮 API 集成测试
 * 使用真实的数据库连接
 */

import { POST, GET, DELETE } from '@/app/api/highlights/route'
import { supabaseAdmin } from '@/lib/supabase'

const shouldRunIntegrationTests = 
  process.env.RUN_INTEGRATION_TESTS === 'true' &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY

const describeIf = shouldRunIntegrationTests ? describe : describe.skip

describeIf('Highlights API - Integration Tests', () => {
  let testStoryId: string
  let testHighlightId: string
  const testDeviceId = `test-device-${Date.now()}`

  // 创建测试故事
  beforeAll(async () => {
    const { data: story } = await supabaseAdmin
      .from('stories')
      .insert({
        words: '测试',
        content: '这是一个测试故事内容，用于测试高亮功能。',
        user_id: testDeviceId,
      })
      .select()
      .single()
    
    testStoryId = story?.id || ''
  })

  // 清理测试数据
  afterAll(async () => {
    if (testStoryId) {
      await supabaseAdmin
        .from('highlights')
        .delete()
        .eq('story_id', testStoryId)
      
      await supabaseAdmin
        .from('stories')
        .delete()
        .eq('id', testStoryId)
    }
  })

  const createRequest = (method: string, body?: any, searchParams?: string) => {
    const url = searchParams 
      ? `http://localhost:3000/api/highlights?${searchParams}`
      : 'http://localhost:3000/api/highlights'
    
    return new Request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }) as any
  }

  it('should create a highlight', async () => {
    const request = createRequest('POST', {
      storyId: testStoryId,
      textContent: '测试故事',
      startIndex: 0,
      endIndex: 4,
      deviceId: testDeviceId,
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.highlight).toBeDefined()
    expect(data.highlight.text_content).toBe('测试故事')
    testHighlightId = data.highlight.id
  })

  it('should get highlights for a story', async () => {
    const request = createRequest('GET', undefined, `storyId=${testStoryId}`)

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.highlights).toBeDefined()
    expect(Array.isArray(data.highlights)).toBe(true)
    expect(data.highlights.length).toBeGreaterThan(0)
  })

  it('should delete a highlight', async () => {
    if (!testHighlightId) return

    const request = createRequest('DELETE', {
      highlightId: testHighlightId,
      deviceId: testDeviceId,
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })
})








