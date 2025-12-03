/**
 * XSS 防护工具函数
 * 用于清理和转义用户输入，防止 XSS 攻击
 */

/**
 * 转义 HTML 特殊字符
 * 将 <, >, &, ", ' 等字符转换为 HTML 实体
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char)
}

/**
 * 清理用户输入文本
 * 移除控制字符、限制长度、转义 HTML
 */
export function sanitizeText(text: string, maxLength: number = 10000): string {
  if (typeof text !== 'string') {
    return ''
  }

  // 移除控制字符（除了换行符、制表符等常见空白字符）
  let cleaned = text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
  
  // 限制长度
  if (cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength)
  }
  
  // 转义 HTML
  return escapeHtml(cleaned)
}

/**
 * 清理高亮文本内容
 * 高亮文本应该只包含纯文本，不允许 HTML
 */
export function sanitizeHighlightText(text: string): string {
  return sanitizeText(text, 500) // 高亮文本限制 500 字符
}

/**
 * 清理想法内容
 * 想法内容应该只包含纯文本，不允许 HTML
 */
export function sanitizeThoughtContent(text: string): string {
  return sanitizeText(text, 500) // 想法内容限制 500 字符
}

/**
 * 清理昵称：
 * - 移除 HTML / 危险内容（复用 sanitizeText / containsDangerousContent 逻辑）
 * - 去掉首尾空格
 * - 限制长度（默认 20）
 */
export function sanitizeNickname(text: string, maxLength: number = 20): string {
  if (typeof text !== 'string') return ''
  if (containsDangerousContent(text)) {
    return ''
  }
  const cleaned = sanitizeText(text, maxLength)
  return cleaned.trim()
}

/**
 * 验证文本是否包含潜在的危险内容
 */
export function containsDangerousContent(text: string): boolean {
  if (typeof text !== 'string') {
    return true
  }

  // 检查是否包含脚本标签
  const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi
  if (scriptPattern.test(text)) {
    return true
  }

  // 检查是否包含事件处理器
  const eventHandlerPattern = /on\w+\s*=/gi
  if (eventHandlerPattern.test(text)) {
    return true
  }

  // 检查是否包含 javascript: 协议
  const javascriptPattern = /javascript:/gi
  if (javascriptPattern.test(text)) {
    return true
  }

  // 检查是否包含 data: 协议（可能用于 base64 编码的恶意内容）
  const dataUrlPattern = /data:text\/html/gi
  if (dataUrlPattern.test(text)) {
    return true
  }

  return false
}

/**
 * 清理并验证用户输入
 * 如果包含危险内容，返回空字符串
 */
export function sanitizeAndValidate(text: string, maxLength: number = 10000): string {
  if (containsDangerousContent(text)) {
    return ''
  }
  return sanitizeText(text, maxLength)
}

