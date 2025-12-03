import {
  escapeHtml,
  sanitizeText,
  sanitizeHighlightText,
  sanitizeThoughtContent,
  containsDangerousContent,
  sanitizeAndValidate,
} from '@/lib/xss-protection'

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    )
  })

  it('should escape ampersand', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B')
  })

  it('should escape quotes', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;')
  })

  it('should not escape safe text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
  })
})

describe('sanitizeText', () => {
  it('should remove control characters', () => {
    const text = 'Hello\x00World\x01Test'
    expect(sanitizeText(text)).toBe('HelloWorldTest')
  })

  it('should limit text length', () => {
    const longText = 'a'.repeat(200)
    expect(sanitizeText(longText, 100).length).toBe(100)
  })

  it('should escape HTML', () => {
    expect(sanitizeText('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
    )
  })
})

describe('sanitizeHighlightText', () => {
  it('should limit to 500 characters', () => {
    const longText = 'a'.repeat(600)
    expect(sanitizeHighlightText(longText).length).toBe(500)
  })

  it('should sanitize dangerous content', () => {
    const dangerous = '<script>alert("XSS")</script>'
    expect(sanitizeHighlightText(dangerous)).not.toContain('<script>')
  })
})

describe('sanitizeThoughtContent', () => {
  it('should limit to 500 characters', () => {
    const longText = 'a'.repeat(600)
    expect(sanitizeThoughtContent(longText).length).toBe(500)
  })

  it('should sanitize dangerous content', () => {
    const dangerous = '<img src=x onerror=alert("XSS")>'
    expect(sanitizeThoughtContent(dangerous)).not.toContain('<img')
  })
})

describe('containsDangerousContent', () => {
  it('should detect script tags', () => {
    expect(containsDangerousContent('<script>alert("XSS")</script>')).toBe(true)
  })

  it('should detect event handlers', () => {
    expect(containsDangerousContent('<img onerror="alert(1)">')).toBe(true)
  })

  it('should detect javascript: protocol', () => {
    expect(containsDangerousContent('javascript:alert("XSS")')).toBe(true)
  })

  it('should detect data: protocol', () => {
    expect(containsDangerousContent('data:text/html,<script>alert(1)</script>')).toBe(true)
  })

  it('should return false for safe content', () => {
    expect(containsDangerousContent('Hello World')).toBe(false)
  })
})

describe('sanitizeAndValidate', () => {
  it('should return empty string for dangerous content', () => {
    expect(sanitizeAndValidate('<script>alert("XSS")</script>')).toBe('')
  })

  it('should sanitize safe content', () => {
    const safe = 'Hello World'
    expect(sanitizeAndValidate(safe)).toBe(safe)
  })
})

